import type { MaybeRef } from '@vueuse/core'
import { buildManualPromise, ensureError } from '@speckle/shared'
import type { MaybeNullOrUndefined, Nullable, Optional } from '@speckle/shared'
import { useServerFileUploadLimit } from '~~/lib/common/composables/serverInfo'
import type {
  UploadableFileItem,
  UploadFileItem
} from '~~/lib/form/composables/fileUpload'
import { importFileLegacy, type ImportFile } from '~~/lib/core/api/fileImport'
import { useAuthCookie } from '~~/lib/auth/composables/auth'
import { BlobUploadStatus, type BlobPostResultItem } from '~~/lib/core/api/blobStorage'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { graphql } from '~/lib/common/generated/gql'
import type {
  UseFileImport_ModelFragment,
  UseFileImport_ProjectFragment
} from '~/lib/common/generated/gql/graphql'
import { useApolloClient } from '@vue/apollo-composable'

const generateUploadUrlMutation = graphql(`
  mutation GenerateUploadUrl($input: GenerateFileUploadUrlInput!) {
    fileUploadMutations {
      generateUploadUrl(input: $input) {
        url
        fileId
      }
    }
  }
`)

const startFileImportMutation = graphql(`
  mutation StartFileImport($input: StartFileImportInput!) {
    fileUploadMutations {
      startFileImport(input: $input) {
        id
      }
    }
  }
`)

export const useFileImportApi = () => {
  const {
    public: { FF_LARGE_FILE_IMPORTS_ENABLED }
  } = useRuntimeConfig()
  const apollo = useApolloClient().client

  const importFileV2: ImportFile = async (params, callbacks) => {
    const { file, projectId, modelId } = params
    const { onProgress } = callbacks || {}

    // Generate upload URL
    const generateUploadUrlResponse = await apollo.mutate({
      mutation: generateUploadUrlMutation,
      variables: {
        input: {
          projectId,
          fileName: file.name
        }
      }
    })

    const generateUploadUrl =
      generateUploadUrlResponse.data?.fileUploadMutations.generateUploadUrl
    if (!generateUploadUrl) {
      const errMsg = getFirstGqlErrorMessage(
        generateUploadUrlResponse.errors,
        "Couldn't generate upload URL"
      )
      throw new Error(errMsg)
    }

    const { url: uploadUrl, fileId } = generateUploadUrl

    // Upload to S3 compatible endpoint
    const request = new XMLHttpRequest()
    const uploadPromise = buildManualPromise<{ etag: string }>()
    request.open('PUT', uploadUrl)
    request.setRequestHeader('Content-Type', file.type)

    request.upload.addEventListener('progress', (e) => {
      const percentage = (e.loaded / e.total) * 100
      onProgress?.(percentage)
    })

    const handleResponse = () => {
      const statusCode = request.status
      if (statusCode >= 200 && statusCode < 300) {
        // Collect etag
        const etag = request.getResponseHeader('ETag')
        if (!etag) {
          return uploadPromise.reject(new Error('No ETag in upload response'))
        }
        return uploadPromise.resolve({ etag })
      } else {
        // Try to resolve error message from XML response w/ regex (dont want to parse XML)
        const errorMessage = request.responseText.match(
          /<Message>(.*?)<\/Message>/
        )?.[1]
        return uploadPromise.reject(
          new Error(errorMessage || `Upload failed with status ${statusCode}`)
        )
      }
    }

    request.addEventListener('load', () => handleResponse())
    request.addEventListener('error', () => handleResponse())
    request.send(file)
    const { etag } = await uploadPromise.promise

    // Now lets start the file import
    const startFileImportResponse = await apollo.mutate({
      mutation: startFileImportMutation,
      variables: {
        input: {
          projectId,
          fileId,
          etag,
          modelId
        }
      }
    })
    const fileImportStarted =
      startFileImportResponse.data?.fileUploadMutations.startFileImport.id
    if (!fileImportStarted) {
      const errMsg = getFirstGqlErrorMessage(
        startFileImportResponse.errors,
        "Couldn't start file import"
      )
      throw new Error(errMsg)
    }

    const res: BlobPostResultItem = {
      fileName: file.name,
      fileSize: file.size,
      formKey: 'file',
      uploadStatus: BlobUploadStatus.Completed,
      uploadError: ''
    }

    return res
  }

  return {
    importFile: FF_LARGE_FILE_IMPORTS_ENABLED ? importFileV2 : importFileLegacy
  }
}

graphql(`
  fragment UseFileImport_Project on Project {
    id
  }
`)

graphql(`
  fragment UseFileImport_Model on Model {
    id
    name
  }
`)

export function useFileImport(params: {
  project: MaybeRef<UseFileImport_ProjectFragment>
  /**
   * Model should exist if upload is automatically triggered. Otherwise you must still feed it in, but
   * at the point when you call uploadSelected().
   */
  model?: MaybeRef<MaybeNullOrUndefined<UseFileImport_ModelFragment>>
  /**
   * If true, the upload will be prepared and validated, but for it to start you must invoke uploadSelected() manually
   */
  manuallyTriggerUpload?: boolean
  /**
   * Optionally handle the file upload completion event.
   */
  fileUploadedCallback?: Optional<(file: UploadFileItem) => void>
  /**
   * Optionally handle the file selection event.
   */
  fileSelectedCallback?: Optional<() => void>
}) {
  const {
    project,
    model,
    manuallyTriggerUpload,
    fileUploadedCallback,
    fileSelectedCallback
  } = params

  const { importFile } = useFileImportApi()
  const { maxSizeInBytes } = useServerFileUploadLimit()
  const authToken = useAuthCookie()
  const apiOrigin = useApiOrigin()

  const accept = ref('.ifc,.stl,.obj')
  const upload = ref(null as Nullable<UploadFileItem>)
  const isUploading = ref(false)

  const isUploadable = computed(() => {
    if (!upload.value) return false
    if (upload.value.error) return false
    if (upload.value.result) return false
    if (isUploading.value) return false
    if (!authToken.value) return false
    if (!upload.value.file) return false
    return true
  })

  const mp = useMixpanel()

  const uploadSelected = async (params?: {
    /**
     * Optionally override model target for the upload
     */
    model: UseFileImport_ModelFragment
  }) => {
    if (!isUploadable.value || !upload.value || !authToken.value) return

    const baseModel = unref(model)
    const overridenModel = params?.model

    isUploading.value = true
    try {
      let finalModel: UseFileImport_ModelFragment
      if (overridenModel) {
        finalModel = overridenModel
      } else if (baseModel) {
        finalModel = baseModel
      } else {
        throw new Error('No model provided for file import')
      }

      const res = await importFile(
        {
          file: upload.value.file,
          projectId: unref(project).id,
          modelName: finalModel.name,
          modelId: finalModel.id,
          authToken: authToken.value,
          apiOrigin
        },
        {
          onProgress: (percentage) => {
            if (upload.value) upload.value.progress = percentage
          }
        }
      )
      upload.value.result = res

      mp.track('Upload Action', {
        type: 'action',
        name: 'create',
        source: 'model card'
      })

      fileUploadedCallback?.(upload.value)
    } catch (e) {
      upload.value.result = {
        uploadStatus: BlobUploadStatus.Error,
        uploadError: ensureError(e).message,
        formKey: 'file'
      }
    } finally {
      upload.value.progress = 100
      isUploading.value = false
    }
  }

  const resetSelected = () => {
    if (isUploading.value) return
    upload.value = null
  }

  const onFilesSelected = async (params: { files: UploadableFileItem[] }) => {
    if (isUploading.value || !authToken.value) return

    const file = params.files[0]
    if (!file) return

    upload.value = {
      ...file,
      result: undefined,
      progress: 0
    }

    if (file.error) {
      return
    }

    fileSelectedCallback?.()
    if (!manuallyTriggerUpload) {
      await uploadSelected()
    }
  }

  return {
    maxSizeInBytes,
    onFilesSelected,
    accept,
    upload,
    isUploading,
    uploadSelected,
    resetSelected,
    isUploadable
  }
}
