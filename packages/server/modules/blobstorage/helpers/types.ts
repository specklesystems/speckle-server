export type BlobStorageRecord = {
  id: string
  streamId: string
  userId: string | null
  objectKey: string | null
  fileName: string
  fileType: string
  fileSize: number | null
  uploadStatus: number
  uploadError: string | null
  createdAt: Date
  fileHash: string | null
}
