import {
  BlobStorageItem,
  BlobStorageItemInput
} from '@/modules/blobstorage/domain/types'
import { MaybeNullOrUndefined, Nullable } from '@speckle/shared'
import type { Readable } from 'stream'

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

export type UploadFileStream = (
  params1: {
    streamId: string
    userId: string | undefined
  },
  params2: {
    blobId: string
    fileName: string
    fileType: string | undefined
    fileStream: Readable | Buffer
  }
) => Promise<{ blobId: string; fileName: string; fileHash: string }>

type FileStream = string | Blob | Readable | Uint8Array | Buffer

export type StoreFileStream = (args: {
  objectKey: string
  fileStream: FileStream
}) => Promise<{ fileHash: string }>
