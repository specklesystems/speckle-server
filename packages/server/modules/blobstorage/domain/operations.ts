import {
  BlobStorageItem,
  BlobStorageItemInput
} from '@/modules/blobstorage/domain/types'
import { MaybeNullOrUndefined } from '@speckle/shared'

export type GetBlobs = (params: {
  streamId?: MaybeNullOrUndefined<string>
  blobIds: string[]
}) => Promise<BlobStorageItem[]>

export type UpsertBlob = (item: BlobStorageItemInput) => Promise<BlobStorageItem>

export type UpdateBlob = (params: {
  id: string
  item: Partial<BlobStorageItem>
}) => Promise<BlobStorageItem>
