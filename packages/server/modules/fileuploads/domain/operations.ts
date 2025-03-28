import {
  FileUploadConvertedStatus,
  FileUploadRecord
} from '@/modules/fileuploads/helpers/types'
import { SaveUploadFileInput } from '@/modules/fileuploads/repositories/fileUploads'
import { Optional } from '@speckle/shared'

export type GetFileInfo = (args: {
  fileId: string
}) => Promise<Optional<FileUploadRecord>>

export type SaveUploadFile = (args: SaveUploadFileInput) => Promise<FileUploadRecord>

export type UpdateUploadFile = (args: {
  fileId: string
  newStatus: FileUploadConvertedStatus
}) => Promise<FileUploadRecord>
export type UpdateFileStatusAndNotify = (params: {
  streamId: string
  branchName: string
  fileId: string
  newStatus: FileUploadConvertedStatus
}) => Promise<void>

export type GetAllPendingUploads = (
  options?: Partial<{ limit: number }>
) => Promise<FileUploadRecord[]>
