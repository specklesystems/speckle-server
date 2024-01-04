import knex from '@/db/knex'
import {
  NotFoundError,
  ResourceMismatch,
  BadRequestError
} from '@/modules/shared/errors'
import { getFileSizeLimitMB } from '@/modules/shared/helpers/envHelper'
import { Readable } from 'stream'
const BlobStorage = () => knex('blob_storage')

type BlobSearchParams = { blobId: string; streamId: string }
const blobLookup = ({ blobId, streamId }: BlobSearchParams) =>
  BlobStorage().where({ id: blobId, streamId })

/**
 * Get blobs - use only internally, as this doesn't require a streamId
 */
export const getBlobs = async ({
  streamId,
  blobIds
}: {
  streamId?: string
  blobIds: string[]
}) => {
  const q = BlobStorage().whereIn('id', blobIds)
  if (streamId) {
    q.andWhere('streamId', streamId)
  }

  return await q
}

export const getAllStreamBlobIds = async ({ streamId }: { streamId: string }) => {
  const res = await BlobStorage().where({ streamId }).select('id')
  return res
}

/**
 * Get a single blob - use only internally, as this doesn't require a streamId
 */
export const getBlob = async ({
  streamId,
  blobId
}: {
  blobId: string
  streamId?: string
}) => {
  const blobs = await getBlobs({ streamId, blobIds: [blobId] })
  return blobs?.length ? blobs[0] : null
}

type FileStream = Readable | ReadableStream | Blob
type FileStorer = ({
  objectKey,
  fileStream
}: {
  objectKey: string
  fileStream: FileStream
}) => Promise<{ fileHash: string }>

export const uploadFileStream = async (
  storeFileStream: FileStorer,
  { streamId, userId }: { streamId: string; userId: string },
  {
    blobId,
    fileName,
    fileType,
    fileStream
  }: { blobId: string; fileName: string; fileType: string; fileStream: FileStream }
) => {
  if (streamId.length !== 10)
    throw new BadRequestError('The stream id has to be of length 10')
  if (userId.length !== 10)
    throw new BadRequestError('The user id has to be of length 10')
  const objectKey = `assets/${streamId}/${blobId}`
  const dbFile = {
    id: blobId,
    streamId,
    userId,
    objectKey,
    fileName,
    fileType
  }
  // need to insert the upload data before starting otherwise the upload finished
  // even might fire faster, than the db insert, causing missing asset data in the db
  await BlobStorage().insert(dbFile).onConflict(['id', 'streamId']).ignore()

  const { fileHash } = await storeFileStream({ objectKey, fileStream })
  // here we should also update the blob db record with the fileHash
  await BlobStorage().where({ id: blobId }).update({ fileHash })
  return { blobId, fileName, fileHash }
}

export const getBlobMetadata = async (
  { streamId, blobId }: { streamId?: string; blobId: string },
  blobRepo = blobLookup
) => {
  if (!streamId) throw new BadRequestError('No steamId provided')
  const obj = (await blobRepo({ blobId, streamId }).first()) || null
  if (!obj) throw new NotFoundError(`The requested asset: ${blobId} doesn't exist`)
  if (obj.streamId !== streamId)
    throw new ResourceMismatch("The stream doesn't have the given resource")
  return obj
}

const blobQuery = ({ streamId, query }: { streamId: string; query: string | null }) => {
  let blobs = BlobStorage().where({ streamId })
  if (query) blobs = blobs.andWhereLike('fileName', `%${query}%`)
  return blobs
}

type BlobRow = {
  [key: string]: unknown
}
export const cursorFromRows = (rows: BlobRow[], cursorTarget: string) => {
  if (!rows || rows.length < 1) return null

  const lastRow = rows[rows.length - 1]
  if (!(cursorTarget in lastRow))
    throw new BadRequestError('The cursor target is not present in the row.')
  const cursor = lastRow[cursorTarget]
  if (!(cursor instanceof Date))
    throw new BadRequestError('The cursor target is not a date object')
  return Buffer.from(cursor.toISOString()).toString('base64')
}

export const decodeCursor = (cursor: string) => {
  const decoded = Buffer.from(cursor, 'base64').toString()
  if (isNaN(Date.parse(decoded)))
    throw new BadRequestError('The cursor is not a base64 encoded date string')
  return decoded
}

export const getBlobMetadataCollection = async ({
  streamId,
  query = null,
  limit = 25,
  cursor = null
}: {
  streamId: string
  query: string | null
  limit: number
  cursor: string | null
}) => {
  const cursorTarget = 'createdAt'
  const limitMax = 25
  const queryLimit = limit && limit < limitMax ? limit : limitMax
  const blobs = blobQuery({ streamId, query })
    .orderBy(cursorTarget, 'desc')
    .limit(queryLimit)
  if (cursor) blobs.andWhere(cursorTarget, '<', decodeCursor(cursor))

  const rows = await blobs
  return {
    blobs: rows,
    cursor: cursorFromRows(rows, cursorTarget)
  }
}

export const blobCollectionSummary = async ({
  streamId,
  query
}: {
  streamId: string
  query: string
}) => {
  const [summary] = await blobQuery({ streamId, query }).sum('fileSize').count('id')
  return {
    totalSize: summary.sum ? parseInt(summary.sum) : 0,
    totalCount: parseInt(summary.count)
  }
}

export const getFileStream = async ({
  getObjectStream,
  streamId,
  blobId
}: {
  getObjectStream: ({ objectKey }: { objectKey: string }) => Promise<unknown>
  streamId: string
  blobId: string
}) => {
  const { objectKey } = await getBlobMetadata({ streamId, blobId })
  return await getObjectStream({ objectKey })
}

export const markUploadSuccess = async (
  getObjectAttributes: ({
    objectKey
  }: {
    objectKey: string
  }) => Promise<{ fileSize: number }>,
  streamId: string,
  blobId: string
) =>
  await updateBlobMetadata(
    streamId,
    blobId,
    async ({ objectKey }: { objectKey: string }) => {
      const { fileSize } = await getObjectAttributes({ objectKey })
      return { uploadStatus: 1, fileSize }
    }
  )

type ObjectDeleter = ({ objectKey }: { objectKey: string }) => Promise<unknown>
export const markUploadOverFileSizeLimit = async (
  deleteObject: ObjectDeleter,
  streamId: string,
  blobId: string
) => await markUploadError(deleteObject, streamId, blobId, 'File size limit reached')

export const markUploadError = async (
  deleteObject: ObjectDeleter,
  streamId: string,
  blobId: string,
  error: string
) =>
  await updateBlobMetadata(
    streamId,
    blobId,
    async ({ objectKey }: { objectKey: string }) => {
      await deleteObject({ objectKey })
      return { uploadStatus: 2, uploadError: error }
    }
  )

export const deleteBlob = async ({
  streamId,
  blobId,
  deleteObject
}: {
  streamId: string
  blobId: string
  deleteObject: ObjectDeleter
}) => {
  const { objectKey } = await getBlobMetadata({ streamId, blobId })
  await deleteObject({ objectKey })
  await blobLookup({ blobId, streamId }).del()
}

const updateBlobMetadata = async (
  streamId: string,
  blobId: string,
  updateCallback: ({ objectKey }: { objectKey: string }) => Promise<object>
) => {
  const { objectKey, fileName } = await getBlobMetadata({ streamId, blobId })
  const updateData = await updateCallback({ objectKey })
  await blobLookup({ blobId, streamId }).update(updateData)
  return { blobId, fileName, ...updateData }
}

export const getFileSizeLimit = () => getFileSizeLimitMB() * 1024 * 1024
