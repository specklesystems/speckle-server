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

export function useFileImport(params: {
  projectId: MaybeRef<string>
  modelName?: MaybeRef<MaybeNullOrUndefined<string>>
}) {
  const { projectId, modelName } = params

  const { maxSizeInBytes } = useServerFileUploadLimit()
  const authToken = useAuthCookie()
  const apiOrigin = useApiOrigin()

  const accept = ref('.ifc,.stl,.obj')
  const upload = ref(null as Nullable<UploadFileItem>)
  const isUploading = ref(false)

  let onFileUploadedCb: Optional<(file: UploadFileItem) => void> = undefined
  const onFileUploaded = (cb: (file: UploadFileItem) => void) => {
    onFileUploadedCb = cb
  }

  const mp = useMixpanel()
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
      // TODO: add file extension
      // const extension = res.fileName?.split('.').reverse()[0]
      mp.track('Upload Action', {
        type: 'action',
        name: 'create',
        source: unref(modelName) ? 'model card' : 'empty card'
        // extension
      })

      onFileUploadedCb?.(upload.value)
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
    upload,
    isUploading,
    onFileUploaded
  }
}
