import { FileUploadRecord } from '@/modules/fileuploads/helpers/types'
import { Optional } from '@speckle/shared'

export type GetFileInfo = (args: {
  fileId: string
}) => Promise<Optional<FileUploadRecord>>
