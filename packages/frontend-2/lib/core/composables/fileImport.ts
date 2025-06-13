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
import { blobUploadStatus } from '~~/lib/core/api/blobStorage'
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
}) {
  const { project, model } = params

  const { maxSizeInBytes } = useServerFileUploadLimit()
  const authToken = useAuthCookie()
  const apiOrigin = useApiOrigin()

  const accept = ref('.ifc,.stl,.obj')
  const upload = ref(null as Nullable<UploadFileItem>)
  const isUploading = ref(false)

  const modelName = computed(() => unref(params.modelName) || unref(model)?.name)

  let onFileUploadedCb: Optional<(file: UploadFileItem) => void> = undefined
  const onFileUploaded = (cb: (file: UploadFileItem) => void) => {
    onFileUploadedCb = cb
  }

  const mp = useMixpanel()
  const onFilesSelected = async (params: {
    files: UploadableFileItem[]
    modelName?: string
    modelDescription?: string
  }) => {
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
          projectId: unref(project).id,
          modelName: params.modelName || modelName.value || undefined,
          modelDescription: params.modelDescription,
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
        source: modelName.value ? 'model card' : 'empty card'
        // extension
      })

      onFileUploadedCb?.(upload.value)
    } catch (e) {
      upload.value.result = {
        uploadStatus: blobUploadStatus.Error,
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
