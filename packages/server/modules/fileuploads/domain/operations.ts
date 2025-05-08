import {
  FileUploadConvertedStatus,
  FileUploadRecord
} from '@/modules/fileuploads/helpers/types'
import { SaveUploadFileInput } from '@/modules/fileuploads/repositories/fileUploads'
import { Optional } from '@speckle/shared'
import { FileImportResultPayload } from '@speckle/shared/dist/commonjs/workers/fileimport/job.js'

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

export type FileIdFromJobId = (params: { jobId: string }) => Promise<string>

export type ProcessFileImportResult = (params: {
  jobId: string
  jobResult: FileImportResultPayload
}) => Promise<void>

export type UpdateFileStatus = (params: {
  fileId: string
  status: FileUploadConvertedStatus
}) => Promise<FileUploadRecord>
