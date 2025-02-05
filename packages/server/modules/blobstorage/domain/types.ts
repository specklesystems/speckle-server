import { Nullable } from '@speckle/shared'
import { SetOptional } from 'type-fest'

export type BlobStorageItem = {
  id: string
  streamId: string
  userId: Nullable<string>
  objectKey: Nullable<string>
  fileName: string
  fileType: string
  fileSize: Nullable<number>
  uploadStatus: number
  uploadError: Nullable<string>
  createdAt: Date
  fileHash: Nullable<string>
}

export type BlobStorageItemInput = SetOptional<
  BlobStorageItem,
  'fileSize' | 'fileType' | 'uploadStatus' | 'uploadError' | 'createdAt' | 'fileHash'
>
