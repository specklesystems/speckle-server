import { FileUploadRecord } from '@/modules/fileuploads/helpers/types'
import { SaveUploadFileInput } from '@/modules/fileuploads/repositories/fileUploads'
import { Optional } from '@speckle/shared'

export type GetFileInfo = (args: {
  fileId: string
}) => Promise<Optional<FileUploadRecord>>

export type SaveUploadFile = (args: SaveUploadFileInput) => Promise<FileUploadRecord>

export type GarbageCollectPendingUploadedFiles = (args: {
  timeoutThresholdSeconds: number
}) => Promise<FileUploadRecord[]>

export type NotifyChangeInFileStatus = (params: {
  file: FileUploadRecord
}) => Promise<void>
