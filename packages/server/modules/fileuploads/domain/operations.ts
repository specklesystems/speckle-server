import type {
  FileUploadConvertedStatus,
  FileUploadRecord,
  FileUploadRecordV2
} from '@/modules/fileuploads/helpers/types'
import type { Optional } from '@speckle/shared'
import type { UploadResult } from '@/modules/blobstorage/domain/types'
import type {
  FileImportResultPayload,
  JobPayloadV1
} from '@speckle/shared/workers/fileimport'

export type GetFileInfo = (args: {
  fileId: string
}) => Promise<Optional<FileUploadRecord>>

export type GetFileInfoV2 = (args: {
  fileId: string
  projectId?: string
}) => Promise<Optional<FileUploadRecordV2>>

export type SaveUploadFileInput = Pick<
  FileUploadRecord,
  | 'streamId'
  | 'branchName'
  | 'userId'
  | 'fileName'
  | 'fileType'
  | 'fileSize'
  | 'modelId'
> & { fileId: string }

export type SaveUploadFileInputV2 = Pick<
  FileUploadRecordV2,
  'projectId' | 'userId' | 'fileName' | 'fileType' | 'fileSize'
> & { fileId: string; modelId: string; modelName: string }

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

export type UpdateFileUpload = (args: {
  id: string
  upload: Partial<FileUploadRecord>
}) => Promise<FileUploadRecord>

export type GarbageCollectPendingUploadedFiles = (args: {
  timeoutThresholdSeconds: number
}) => Promise<FileUploadRecord[]>

export type FailPendingUploadedFiles = (args: {
  uploadIds: string[]
}) => Promise<FileUploadRecord[]>

export type NotifyChangeInFileStatus = (params: {
  file: FileUploadRecord
}) => Promise<void>

export type ProcessFileImportResult = (params: {
  blobId: string
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
  JobPayloadV1,
  'modelId' | 'projectId' | 'fileType' | 'fileName' | 'blobId'
> & { userId: string }

export type ScheduleFileimportJob = (args: JobPayloadV1) => Promise<void>

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
}) => Promise<FileUploadRecordV2 & { modelName: string }>

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
