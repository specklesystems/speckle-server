import { MaybeRef } from '@vueuse/core'
import { ensureError, MaybeNullOrUndefined, Nullable } from '@speckle/shared'
import { useServerFileUploadLimit } from '~~/lib/common/composables/serverInfo'
import { UploadableFileItem, UploadFileItem } from '~~/lib/form/composables/fileUpload'
import { importFile } from '~~/lib/core/api/fileImport'
import { useAuthCookie } from '~~/lib/auth/composables/auth'
import { BlobUploadStatus } from '~~/lib/core/api/blobStorage'

export function useFileImport(params: {
  projectId: MaybeRef<string>
  modelName?: MaybeRef<MaybeNullOrUndefined<string>>
}) {
  const { projectId, modelName } = params

  const { maxSizeInBytes } = useServerFileUploadLimit()
  const authToken = useAuthCookie()
  const {
    public: { apiOrigin }
  } = useRuntimeConfig()

  const accept = ref('.ifc,.stl,.obj,.mtl')
  const error = ref(null as Nullable<Error>)
  const upload = ref(null as Nullable<UploadFileItem>)
  const isUploading = ref(false)

  const onFilesSelected = async (params: { files: UploadableFileItem[] }) => {
    if (isUploading.value || !authToken.value) return

    const file = params.files[0]
    if (!file) return

    if (file.error) {
      error.value = file.error
      return
    }

    error.value = null
    upload.value = {
      ...file,
      result: undefined,
      progress: 0
    }

    isUploading.value = true
    try {
      const res = await importFile(
        {
          file: upload.value.file,
          projectId: unref(projectId),
          modelName: unref(modelName) || undefined,
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
    } catch (e) {
      upload.value.result = {
        uploadStatus: BlobUploadStatus.Failure,
        uploadError: ensureError(e).message,
        formKey: 'file'
      }
    } finally {
      upload.value.progress = 100
      isUploading.value = false
    }
  }

  return {
    maxSizeInBytes,
    onFilesSelected,
    accept,
    error,
    upload,
    isUploading
  }
}
