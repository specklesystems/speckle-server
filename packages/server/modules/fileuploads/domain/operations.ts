import {
  FileUploadConvertedStatus,
  FileUploadRecord,
  FileUploadRecordV2
} from '@/modules/fileuploads/helpers/types'
import { Optional } from '@speckle/shared'
import { FileImportResultPayload } from '@speckle/shared/workers/fileimport'

export type GetFileInfo = (args: {
  fileId: string
}) => Promise<Optional<FileUploadRecord>>

export type SaveUploadFileInput = Pick<
  FileUploadRecord,
  'streamId' | 'branchName' | 'userId' | 'fileName' | 'fileType' | 'fileSize'
> & { fileId: string }

export type SaveUploadFileInputV2 = Pick<
  FileUploadRecordV2,
  'projectId' | 'modelId' | 'userId' | 'fileName' | 'fileType' | 'fileSize'
> & { fileId: string }

export type SaveUploadFile = (args: SaveUploadFileInput) => Promise<FileUploadRecord>

export type SaveUploadFileV2 = (
  args: SaveUploadFileInputV2
) => Promise<FileUploadRecordV2>

export type GarbageCollectPendingUploadedFiles = (args: {
  timeoutThresholdSeconds: number
}) => Promise<FileUploadRecord[]>

export type NotifyChangeInFileStatus = (params: {
  file: FileUploadRecord
}) => Promise<void>

export type ProcessFileImportResult = (params: {
  jobId: string
  jobResult: FileImportResultPayload
}) => Promise<void>

export type UpdateFileStatus = (params: {
  fileId: string
  status: FileUploadConvertedStatus
  convertedMessage: string
}) => Promise<FileUploadRecord>
