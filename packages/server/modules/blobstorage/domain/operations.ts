import {
  BlobStorageItem,
  BlobStorageItemInput
} from '@/modules/blobstorage/domain/types'
import { MaybeNullOrUndefined, Nullable } from '@speckle/shared'

export type GetBlobs = (params: {
  streamId?: MaybeNullOrUndefined<string>
  blobIds: string[]
}) => Promise<BlobStorageItem[]>

export type UpsertBlob = (item: BlobStorageItemInput) => Promise<BlobStorageItem>

export type UpdateBlob = (params: {
  id: string
  item: Partial<BlobStorageItem>
  streamId?: string
}) => Promise<BlobStorageItem>

export type DeleteBlob = (params: { id: string; streamId?: string }) => Promise<number>

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
