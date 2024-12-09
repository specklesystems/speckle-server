import type stream from 'stream'
import type { Readable } from 'stream'

export type GetObjectStream = (params: {
  objectKey: string
}) => Promise<stream.Readable>

export type GetObjectAttributes = (params: { objectKey: string }) => Promise<{
  fileSize: number
}>

type FileStream = string | Blob | Readable | Uint8Array | Buffer

export type StoreFileStream = (args: {
  objectKey: string
  fileStream: FileStream
}) => Promise<{ fileHash: string }>

export type DeleteObject = (params: { objectKey: string }) => Promise<void>

export type EnsureStorageAccess = (params: {
  createBucketIfNotExists: boolean
}) => Promise<void>
