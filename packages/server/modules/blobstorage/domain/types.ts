import type { Nullable } from '@speckle/shared'
import type { BlobUploadStatus } from '@speckle/shared/blobs'
import type { SetOptional } from 'type-fest'

export type BlobStorageItem = {
  id: string
  streamId: string
  userId: Nullable<string>
  objectKey: Nullable<string>
  fileName: string
  fileType: string
  fileSize: Nullable<number>
  uploadStatus: BlobUploadStatus
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
