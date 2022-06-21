const knex = require('@/db/knex')
const {
  NotFoundError,
  ResourceMismatch,
  BadRequestError
} = require('@/modules/shared/errors')
const BlobStorage = () => knex('blob_storage')

const blobLookup = ({ blobId }) => BlobStorage().where({ id: blobId })

const uploadFileStream = async (
  storeFileStream,
  { streamId, userId },
  { blobId, fileName, fileType, fileStream }
) => {
  if (blobId.length !== 10)
    throw new BadRequestError('The blob id has to be of length 10')
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
  await BlobStorage().insert(dbFile)
  const { fileHash } = await storeFileStream({ objectKey, fileStream })
  // here we should also update the blob db record with the fileHash
  return { blobId, fileName, fileHash }
}

const getBlobMetadata = async ({ streamId, blobId }, blobRepo = blobLookup) => {
  const obj = (await blobRepo({ blobId }).first()) || null
  if (!obj) throw new NotFoundError(`The requested asset: ${blobId} doesn't exist`)
  if (!streamId) throw new BadRequestError('No steamId provided')
  if (obj.streamId !== streamId)
    throw new ResourceMismatch("The stream doesn't have the given resource")
  return obj
}

const blobQuery = ({ streamId, query }) => {
  let blobs = BlobStorage().where({ streamId })
  if (query) blobs = blobs.andWhereLike('fileName', `%${query}%`)
  return blobs
}

const cursorFromRows = (rows, cursorTarget) => {
  if (rows?.length > 0) {
    const lastRow = rows[rows.length - 1]
    const cursor = lastRow[cursorTarget]
    if (!(cursor instanceof Date))
      throw new BadRequestError('The cursor target is not a date object')
    return Buffer.from(cursor.toISOString()).toString('base64')
  } else {
    return null
  }
}

const decodeCursor = (cursor) => {
  const decoded = Buffer.from(cursor, 'base64').toString()
  if (isNaN(Date.parse(decoded)))
    throw new BadRequestError('The cursor is not a base64 encoded date string')
  return decoded
}

const getBlobMetadataCollection = async ({
  streamId,
  query = null,
  limit = 25,
  cursor = null
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

const blobCollectionSummary = async ({ streamId, query }) => {
  const [summary] = await blobQuery({ streamId, query }).sum('fileSize').count('id')
  return {
    totalSize: summary.sum ? parseInt(summary.sum) : 0,
    totalCount: parseInt(summary.count)
  }
}

const getFileStream = async ({ getObjectStream, streamId, blobId }) => {
  const { objectKey } = await getBlobMetadata({ streamId, blobId })
  return await getObjectStream({ objectKey })
}

const markUploadSuccess = async (getObjectAttributes, streamId, blobId) =>
  await updateBlobMetadata(streamId, blobId, async ({ objectKey }) => {
    const { fileSize } = await getObjectAttributes({ objectKey })
    return { uploadStatus: 1, fileSize }
  })

const markUploadOverFileSizeLimit = async (deleteObject, streamId, blobId) =>
  await markUploadError(deleteObject, streamId, blobId, 'File size limit reached')

const markUploadError = async (deleteObject, streamId, blobId, error) =>
  await updateBlobMetadata(streamId, blobId, async ({ objectKey }) => {
    await deleteObject({ objectKey })
    return { uploadStatus: 2, uploadError: error }
  })

const deleteBlob = async ({ streamId, blobId, deleteObject }) => {
  const { objectKey } = await getBlobMetadata({ streamId, blobId })
  await deleteObject({ objectKey })
  await blobLookup({ blobId }).del()
}

const updateBlobMetadata = async (streamId, blobId, updateCallback) => {
  const { objectKey, fileName } = await getBlobMetadata({ streamId, blobId })
  const updateData = await updateCallback({ objectKey })
  await blobLookup({ blobId }).update(updateData)
  return { blobId, fileName, ...updateData }
}

module.exports = {
  cursorFromRows,
  decodeCursor,
  getBlobMetadata,
  uploadFileStream,
  markUploadSuccess,
  markUploadOverFileSizeLimit,
  markUploadError,
  getFileStream,
  deleteBlob,
  getBlobMetadataCollection,
  blobCollectionSummary
}
