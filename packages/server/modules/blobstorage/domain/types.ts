import { Nullable } from '@speckle/shared'
import { SetOptional } from 'type-fest'

export enum BlobUploadStatus {
  Pending = 0,
  Completed = 1,
  Error = 2
}

export type BlobStorageItem = {
  id: string
  streamId: string
  userId: Nullable<string>
  objectKey: Nullable<string>
  fileName: string
  fileType: string
  fileSize: Nullable<number>
  uploadStatus: number | BlobUploadStatus
  uploadError: Nullable<string>
  createdAt: Date
  fileHash: Nullable<string>
}

export type BlobStorageItemInput = SetOptional<
  BlobStorageItem,
  'fileSize' | 'fileType' | 'uploadStatus' | 'uploadError' | 'createdAt' | 'fileHash'
>

export type UploadResult = ProcessingResult & {
  formKey: string
}

export type ProcessingResult = {
  uploadStatus?: number
  uploadError?: Nullable<Error | string>
  blobId: string
  fileName: string
  fileSize: Nullable<number>
}
