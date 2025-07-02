import type { MaybeRef } from '@vueuse/core'
import { buildManualPromise, ensureError, throwUncoveredError } from '@speckle/shared'
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
import { useIsNextGenFileImporterEnabled } from '~/composables/globals'
import type {
  UseFailedFileImportJobUtils_FileUploadFragment,
  UseFileImport_ModelFragment,
  UseFileImport_ProjectFragment
} from '~/lib/common/generated/gql/graphql'
import { useApolloClient } from '@vue/apollo-composable'
import {
  FileTooLargeError,
  ForbiddenFileTypeError,
  generateFileId,
  MissingFileExtensionError,
  prettyFileSize,
  resolveFileExtension
} from '@speckle/ui-components'
import { FileUploadConvertedStatus } from '@speckle/shared/blobs'
import dayjs from 'dayjs'
import { uniqBy } from 'lodash-es'

export const FailedFileImportJobError = <const>{
  InvalidFileType: 'InvalidFileType',
  MissingFileExtensionError: 'MissingFileExtensionError',
  FileTooLarge: 'FileTooLarge',
  UploadFailed: 'UploadFailed',
  ImportFailed: 'ImportFailed'
}

export type FailedFileImportJobError =
  (typeof FailedFileImportJobError)[keyof typeof FailedFileImportJobError]

export type FailedFileImportJob = {
  id: string
  fileName: string
  projectId: string
  file?: File // only available if job failed before upload started
  modelId: string | null // null if error occurred before model was created
  error: { type: FailedFileImportJobError; message: string }
  date: Date
}

type GlobalFileImportManagerState = {
  failedJobs: FailedFileImportJob[]
  activeUploads: string[]
}

graphql(`
  fragment UseFailedFileImportJobUtils_FileUpload on FileUpload {
    id
    fileName
    projectId
    modelId
    updatedAt
    convertedStatus
    convertedMessage
  }
`)

export const useFailedFileImportJobUtils = () => {
  const { maxSizeInBytes, accept } = useFileImportBaseSettings()

  const convertUploadToFailedJob = (
    upload: UseFailedFileImportJobUtils_FileUploadFragment
  ): FailedFileImportJob => {
    if (upload.convertedStatus !== FileUploadConvertedStatus.Error) {
      throw new Error('Cannot convert upload to failed job if it is not in error state')
    }

    return {
      id: upload.id,
      projectId: upload.projectId,
      modelId: upload.modelId || null,
      fileName: upload.fileName,
      date: dayjs(upload.updatedAt).toDate(),
      error: {
        type: FailedFileImportJobError.ImportFailed,
        message:
          upload.convertedMessage || 'An unknown error occurred during file import'
      }
    }
  }

  const getErrorMessage = (job: FailedFileImportJob) => {
    switch (job.error.type) {
      case FailedFileImportJobError.FileTooLarge: {
        let base = `The file is too large to be uploaded. The maximum file size is ${prettyFileSize(
          maxSizeInBytes.value
        )}`

        if (job.file) {
          base += ` while the file you tried to upload is ${prettyFileSize(
            job.file.size
          )}.`
        } else {
          base += '.'
        }
        return base
      }
      case FailedFileImportJobError.MissingFileExtensionError:
        return `The file you tried to upload does not have a valid file extension.`
      case FailedFileImportJobError.InvalidFileType: {
        const fileExtension = resolveFileExtension(job.fileName)
        return `The file you tried to upload (${fileExtension}) is not a supported file type. Only ${accept.value} are supported by this server.`
      }
      case FailedFileImportJobError.ImportFailed:
      case FailedFileImportJobError.UploadFailed: {
        const isImport = job.error.type === FailedFileImportJobError.ImportFailed
        const base = `The file ${isImport ? 'import' : 'upload'} failed unexpectedly.`
        return base
      }
      default:
        throwUncoveredError(job.error.type)
    }
  }

  return {
    convertUploadToFailedJob,
    getErrorMessage
  }
}

export const useGlobalFileImportManager = () => {
  const state = useState<GlobalFileImportManagerState>(
    'global_file_import_manager',
    () => ({
      failedJobs: [],
      activeUploads: []
    })
  )

  const addFailedJob = (job: FailedFileImportJob) => {
    state.value.failedJobs = uniqBy([...state.value.failedJobs, job], (job) => job.id)
  }

  const clearFailedJobs = () => {
    state.value.failedJobs = []
  }

  const registerActiveUpload = (uploadId: string) => {
    if (!state.value.activeUploads.includes(uploadId)) {
      state.value.activeUploads = [...state.value.activeUploads, uploadId]
    }
  }

  const unregisterActiveUpload = (uploadId: string) => {
    state.value.activeUploads = state.value.activeUploads.filter(
      (id) => id !== uploadId
    )
  }

  const unregisterAllActiveUploads = () => {
    state.value.activeUploads = []
  }

  const hasActiveUploads = computed(() => {
    return state.value.activeUploads.length > 0
  })

  const failedJobs = computed(() => state.value.failedJobs)

  return {
    registerActiveUpload,
    unregisterActiveUpload,
    unregisterAllActiveUploads,
    hasActiveUploads,
    addFailedJob,
    clearFailedJobs,
    failedJobs
  }
}

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
  const { registerActiveUpload, unregisterActiveUpload } = useGlobalFileImportManager()

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
          new Error(errorMessage || `Upload failed unexpectedly`)
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

  const importFile: ImportFile = async (...args) => {
    const resolveUploadId = () => {
      const params = args[0]

      const fileId = generateFileId(params.file)
      return JSON.stringify({
        fileId,
        projectId: params.projectId,
        modelId: params.modelId,
        modelName: params.modelName
      })
    }

    const uploadId = resolveUploadId()
    try {
      registerActiveUpload(uploadId)
      return await (FF_LARGE_FILE_IMPORTS_ENABLED ? importFileV2 : importFileLegacy)(
        ...args
      )
    } finally {
      unregisterActiveUpload(uploadId)
    }
  }

  return {
    importFile
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

export const useFileImportBaseSettings = () => {
  const { maxSizeInBytes } = useServerFileUploadLimit()
  const isNextGenFileImporterEnabled = useIsNextGenFileImporterEnabled()

  const accept = computed(
    () => `.ifc,.stl,.obj${isNextGenFileImporterEnabled.value ? ',.skp' : ''}`
  )

  return { maxSizeInBytes, accept }
}

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
  /**
   * Optionally handle errors that occur either on file selection or during upload (NOT during the async import job)
   */
  errorCallback?: Optional<(params: { failedJob: FailedFileImportJob }) => void>
}) {
  const {
    project,
    model,
    manuallyTriggerUpload,
    fileUploadedCallback,
    fileSelectedCallback,
    errorCallback
  } = params

  const { maxSizeInBytes, accept } = useFileImportBaseSettings()
  const logger = useLogger()
  const { importFile } = useFileImportApi()
  const authToken = useAuthCookie()
  const apiOrigin = useApiOrigin()

  const upload = ref(
    null as Nullable<UploadFileItem & { model: Nullable<UseFileImport_ModelFragment> }>
  )
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

  const handleError = () => {
    if (!errorCallback || !upload.value) return

    // Figure out what happened and report to callback
    let error: Optional<FailedFileImportJob['error']> = undefined

    if (upload.value.error) {
      // Pre-upload validation error
      if (upload.value.error instanceof FileTooLargeError) {
        error = {
          type: FailedFileImportJobError.FileTooLarge,
          message: upload.value.error.message
        }
      } else if (upload.value.error instanceof MissingFileExtensionError) {
        error = {
          type: FailedFileImportJobError.MissingFileExtensionError,
          message: upload.value.error.message
        }
      } else if (upload.value.error instanceof ForbiddenFileTypeError) {
        error = {
          type: FailedFileImportJobError.InvalidFileType,
          message: upload.value.error.message
        }
      }
    } else if (upload.value.result?.uploadError) {
      // Post-upload error
      error = {
        type: FailedFileImportJobError.UploadFailed,
        message: upload.value.result.uploadError
      }
    }

    if (!error) {
      error = {
        type: FailedFileImportJobError.UploadFailed,
        message: 'An unknown error occurred during file upload'
      }
    }

    const failedJob: FailedFileImportJob = {
      id: upload.value.id,
      fileName: upload.value.file.name,
      projectId: unref(project).id,
      modelId: upload.value.model?.id || null,
      error,
      date: new Date()
    }

    // Log error to console/seq
    logger[upload.value.result?.uploadError ? 'error' : 'warn'](
      {
        failedJob
      },
      'File import failed'
    )

    errorCallback({ failedJob })
  }

  const uploadSelected = async (params?: {
    /**
     * Optionally override model target for the upload
     */
    model: UseFileImport_ModelFragment
  }) => {
    if (!isUploadable.value || !upload.value || !authToken.value) return

    if (params?.model) {
      upload.value.model = params.model
    }

    isUploading.value = true
    try {
      if (!upload.value.model) {
        throw new Error('No model provided for file import')
      }

      const res = await importFile(
        {
          file: upload.value.file,
          projectId: unref(project).id,
          modelName: upload.value.model.name,
          modelId: upload.value.model.id,
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
      handleError()
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
      progress: 0,
      model: unref(model) || null
    }

    if (file.error) {
      handleError()
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
