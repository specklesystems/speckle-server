import type {
  BlobStorageItem,
  BlobStorageItemInput
} from '@/modules/blobstorage/domain/types'
import type { MaybeNullOrUndefined, Nullable, Optional } from '@speckle/shared'
import type { BlobUploadStatus } from '@speckle/shared/blobs'
import type { Readable } from 'stream'
import type { StoreFileStream } from '@/modules/blobstorage/domain/storageOperations'

export type GetBlob = (params: {
  streamId: string
  blobId: string
}) => Promise<Optional<BlobStorageItem>>

export type GetBlobs = (params: {
  streamId?: MaybeNullOrUndefined<string>
  blobIds?: string[]
}) => Promise<BlobStorageItem[]>

export type UpsertBlob = (item: BlobStorageItemInput) => Promise<BlobStorageItem>

export type UpdateBlob = (params: {
  id: string
  item: Partial<BlobStorageItem>
  filter?: {
    streamId?: string
    uploadStatus?: BlobUploadStatus
  }
}) => Promise<BlobStorageItem>

export type DeleteBlob = (params: { id: string; streamId?: string }) => Promise<number>

export type FullyDeleteBlob = (params: {
  blobId: string
  streamId: string
}) => Promise<void>

export type GetBlobMetadata = (params: {
  blobId: string
  streamId: string
}) => Promise<BlobStorageItem>

export type GetBlobMetadataCollection = (params: {
  streamId: string
  query?: Nullable<string>
  limit?: Nullable<number>
  cursor?: Nullable<string>
}) => Promise<{ blobs: BlobStorageItem[]; cursor: Nullable<string> }>

export type UploadFileStream = (
  streamData: {
    streamId: string
    userId: string | undefined
  },
  blobData: {
    blobId: string
    fileName: string
    fileType: string | undefined
    fileStream: Readable | Buffer
  }
) => Promise<{ blobId: string; fileName: string; fileHash: string }>

export type { StoreFileStream }

export type GeneratePresignedUrl = (params: {
  projectId: string
  userId: string
  blobId: string
  fileName: string
  urlExpiryDurationSeconds: number
}) => Promise<string>

export type GetSignedUrl = (params: {
  objectKey: string
  urlExpiryDurationSeconds: number
}) => Promise<string>

export type GetBlobMetadataFromStorage = (params: {
  objectKey: string
}) => Promise<{ eTag: Optional<string>; contentLength: Optional<number> }>

export type RegisterCompletedUpload = (params: {
  projectId: string
  blobId: string
  expectedETag: string
  maximumFileSize: number
}) => Promise<BlobStorageItem>

export type ExpirePendingUploads = (params: {
  timeoutThresholdSeconds: number
  errMessage: string
}) => Promise<BlobStorageItem[]>
