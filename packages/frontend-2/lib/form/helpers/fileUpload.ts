import type { UploadFileItem } from '@speckle/ui-components'

export type FileAreaUploadingPayload = {
  isUploading: boolean
  upload: UploadFileItem
  error: string | null
}
