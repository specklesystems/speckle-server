import type { MaybeRef } from '@vueuse/core'
import { ensureError } from '@speckle/shared'
import type { MaybeNullOrUndefined, Nullable, Optional } from '@speckle/shared'
import { useServerFileUploadLimit } from '~~/lib/common/composables/serverInfo'
import type {
  UploadableFileItem,
  UploadFileItem
} from '~~/lib/form/composables/fileUpload'
import { importFile } from '~~/lib/core/api/fileImport'
import { useAuthCookie } from '~~/lib/auth/composables/auth'
import { BlobUploadStatus } from '~~/lib/core/api/blobStorage'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { graphql } from '~/lib/common/generated/gql'
import type {
  UseFileImport_ModelFragment,
  UseFileImport_ProjectFragment
} from '~/lib/common/generated/gql/graphql'

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
  model?: MaybeRef<MaybeNullOrUndefined<UseFileImport_ModelFragment>>
  /**
   * Sometimes we don't have a model, but we still want to specify a target model name (e.g. for
   * model list view uploads, where list items don't necessarily represent real models)
   */
  modelName?: MaybeRef<MaybeNullOrUndefined<string>>
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

  const { maxSizeInBytes } = useServerFileUploadLimit()
  const authToken = useAuthCookie()
  const apiOrigin = useApiOrigin()

  const accept = ref('.ifc,.stl,.obj')
  const upload = ref(null as Nullable<UploadFileItem & { modelName: Optional<string> }>)
  const isUploading = ref(false)

  const modelName = computed(() => unref(params.modelName) || unref(model)?.name)
  const isUploadable = computed(() => {
    if (!upload.value) return false
    if (upload.value.error) return false
    if (isUploading.value) return false
    if (!authToken.value) return false
    if (!upload.value.file) return false
    return true
  })

  const mp = useMixpanel()

  const uploadSelected = async (params?: {
    /**
     * Optionally override model name to target for the upload
     */
    modelName?: string
  }) => {
    if (!isUploadable.value || !upload.value || !authToken.value) return
    const finalModelName = params?.modelName || upload.value.modelName

    isUploading.value = true
    try {
      const res = await importFile(
        {
          file: upload.value.file,
          projectId: unref(project).id,
          modelName: finalModelName,
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
      // TODO: add file extension
      // const extension = res.fileName?.split('.').reverse()[0]
      mp.track('Upload Action', {
        type: 'action',
        name: 'create',
        source: finalModelName ? 'model card' : 'empty card'
        // extension
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

  const onFilesSelected = async (params: {
    files: UploadableFileItem[]
    /**
     * Optionally override model name to target for the upload
     */
    modelName?: string
  }) => {
    if (isUploading.value || !authToken.value) return

    const file = params.files[0]
    if (!file) return

    upload.value = {
      ...file,
      result: undefined,
      progress: 0,
      modelName: params.modelName || modelName.value || undefined
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
