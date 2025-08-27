import type { Nullable } from '@speckle/shared'

export enum FileUploadConvertedStatus {
  Queued = 0,
  Converting = 1,
  Completed = 2,
  Error = 3
}

export type FileUploadRecordMetadata = {
  description?: string
}

type FileUploadPerformanceData = {
  durationSeconds: number
  downloadDurationSeconds: number
  parseDurationSeconds: number
}

export type FileUploadRecord = {
  id: string
  streamId: string
  branchName: string
  modelId: Nullable<string>
  userId: string
  fileName: string
  fileType: string
  fileSize: Nullable<number>
  uploadComplete: boolean
  uploadDate: Date
  convertedStatus: number | FileUploadConvertedStatus
  convertedLastUpdate: Date
  convertedMessage: Nullable<string>
  convertedCommitId: Nullable<string>
  metadata: Nullable<FileUploadRecordMetadata>
  performanceData: Nullable<FileUploadPerformanceData>
}

export type FileUploadRecordWithProjectId = Omit<
  FileUploadRecord,
  'streamId' | 'branchName'
> & {
  projectId: string
}

export type FileUploadGraphQLReturn = FileUploadRecord | FileUploadRecordWithProjectId
