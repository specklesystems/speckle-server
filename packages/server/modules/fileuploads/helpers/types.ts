import { Nullable } from '@speckle/shared'

export enum FileUploadConvertedStatus {
  Queued = 0,
  Converting = 1,
  Completed = 2,
  Error = 3
}

export type FileUploadRecord = {
  id: string
  streamId: string
  branchName: string
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
}

export type FileUploadGraphQLReturn = FileUploadRecord
