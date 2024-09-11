import { Nullable } from '@speckle/shared'

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
