import type {
  FileUploadConvertedStatus,
  FileUploadRecord,
  FileUploadRecordWithProjectId
} from '@/modules/fileuploads/helpers/types'
import type { Optional } from '@speckle/shared'
import type { UploadResult } from '@/modules/blobstorage/domain/types'
import type {
  FileImportResultPayload,
  JobPayload
} from '@speckle/shared/workers/fileimport'
import type { FileImportQueue } from '@/modules/fileuploads/domain/types'

export type GetFileInfo = (args: {
  fileId: string
  projectId?: string
}) => Promise<Optional<FileUploadRecordWithProjectId>>

export type SaveUploadFileInputV2 = Pick<
  FileUploadRecordWithProjectId,
  'projectId' | 'userId' | 'fileName' | 'fileType' | 'fileSize'
> & { fileId: string; modelId: string; modelName: string }

export type InsertNewUploadAndNotifyV2 = (
  uploadResults: SaveUploadFileInputV2
) => Promise<FileUploadRecordWithProjectId>

export type SaveUploadFileV2 = (
  args: SaveUploadFileInputV2
) => Promise<FileUploadRecordWithProjectId>

export type UpdateFileUpload = (args: {
  id: string
  upload: Partial<FileUploadRecord>
}) => Promise<FileUploadRecord>

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
  projectId: string
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

export type PushJobToFileImporter = (
  args: { scheduleJob: ScheduleFileimportJob } & FileImportMessage
) => Promise<void>

export type RegisterUploadCompleteAndStartFileImport = (args: {
  projectId: string
  modelId: string
  fileId: string
  userId: string
  expectedETag: string
  maximumFileSize: number
}) => Promise<FileUploadRecordWithProjectId & { modelName: string }>

export type GetModelUploadsBaseArgs = {
  projectId: string
  modelId: string
}

export type GetModelUploadsArgs = GetModelUploadsBaseArgs & {
  limit?: number
  cursor?: string | null
}

export type GetModelUploadsItems = (params: GetModelUploadsArgs) => Promise<{
  items: FileUploadRecord[]
  cursor: string | null
}>

export type GetModelUploadsTotalCount = (
  params: GetModelUploadsBaseArgs
) => Promise<number>

export type GetModelUploads = (params: GetModelUploadsArgs) => Promise<{
  items: FileUploadRecord[]
  totalCount: number
  cursor: string | null
}>

export type FindQueue = (filter: {
  fileType: string
}) => Pick<FileImportQueue, 'scheduleJob' | 'supportedFileTypes'> | undefined
