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

export type GetFileInfoV2 = (args: {
  fileId: string
  projectId?: string
}) => Promise<Optional<FileUploadRecordV2>>

export type SaveUploadFileInput = Pick<
  FileUploadRecord,
  'streamId' | 'branchName' | 'userId' | 'fileName' | 'fileType' | 'fileSize'
> & { fileId: string; description?: string }

export type SaveUploadFileInputV2 = Pick<
  FileUploadRecordV2,
  'projectId' | 'userId' | 'fileName' | 'fileType' | 'fileSize'
> & { fileId: string; modelId: string; modelName: string; description?: string }

export type SaveUploadFile = (args: SaveUploadFileInput) => Promise<FileUploadRecord>

export type InsertNewUploadAndNotify = (
  uploadResults: SaveUploadFileInput
) => Promise<FileUploadRecord>

export type InsertNewUploadAndNotifyV2 = (
  uploadResults: SaveUploadFileInputV2
) => Promise<FileUploadRecordV2>

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

export type RegisterUploadCompleteAndStartFileImport = (args: {
  projectId: string
  modelId: string
  fileId: string
  userId: string
  expectedETag: string
  maximumFileSize: number
}) => Promise<FileUploadRecordV2 & { modelName: string }>
