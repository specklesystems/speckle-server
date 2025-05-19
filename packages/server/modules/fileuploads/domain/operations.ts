import {
  FileUploadConvertedStatus,
  FileUploadRecord,
  FileUploadRecordV2
} from '@/modules/fileuploads/helpers/types'
import { Optional } from '@speckle/shared'
import { UploadResult } from '@/modules/blobstorage/domain/types'
import { FileImportResultPayload, JobPayload } from '@speckle/shared/workers/fileimport'

export type GetFileInfo = (args: {
  fileId: string
}) => Promise<Optional<FileUploadRecord>>

export type SaveUploadFileInput = Pick<
  FileUploadRecord,
  'streamId' | 'branchName' | 'userId' | 'fileName' | 'fileType' | 'fileSize'
> & { fileId: string }

export type SaveUploadFileInputV2 = Pick<
  FileUploadRecordV2,
  'projectId' | 'userId' | 'fileName' | 'fileType' | 'fileSize'
> & { fileId: string; modelId: string }

export type SaveUploadFile = (args: SaveUploadFileInput) => Promise<FileUploadRecord>

export type InsertNewUploadAndNotify = (
  uploadResults: SaveUploadFileInputV2
) => Promise<void>

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
  convertedCommitId: string | null
}) => Promise<FileUploadRecord>

export type UploadedFile = UploadResult & { userId: string }

export type FileImportMessage = Pick<
  JobPayload,
  'modelId' | 'projectId' | 'fileType' | 'fileName' | 'blobId'
> & { jobId: string; userId: string }

export type ScheduleFileimportJob = (args: JobPayload) => Promise<void>

export type PushJobToFileImporter = (args: FileImportMessage) => Promise<void>
