const knex = require('@/db/knex')
const { getBlobMetadataFactory } = require('@/modules/blobstorage/repositories')
const { BadRequestError } = require('@/modules/shared/errors')
const { getFileSizeLimitMB } = require('@/modules/shared/helpers/envHelper')
const BlobStorage = () => knex('blob_storage')

const blobLookup = ({ blobId, streamId }) =>
  BlobStorage().where({ id: blobId, streamId })

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

/**
 * @param {{
 *   streamId: string,
 *   query?: string | null,
 *   limit?: number | null,
 *   cursor?: string | null
 * }} param0
 * @returns
 */
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
  const { objectKey } = await getBlobMetadataFactory({ db: knex })({ streamId, blobId })
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
  const { objectKey } = await getBlobMetadataFactory({ db: knex })({ streamId, blobId })
  await deleteObject({ objectKey })
  await blobLookup({ blobId, streamId }).del()
}

const updateBlobMetadata = async (streamId, blobId, updateCallback) => {
  const { objectKey, fileName } = await getBlobMetadataFactory({ db: knex })({
    streamId,
    blobId
  })
  const updateData = await updateCallback({ objectKey })
  await blobLookup({ blobId, streamId }).update(updateData)
  return { blobId, fileName, ...updateData }
}

const getFileSizeLimit = () => getFileSizeLimitMB() * 1024 * 1024

module.exports = {
  cursorFromRows,
  decodeCursor,
  markUploadSuccess,
  markUploadOverFileSizeLimit,
  markUploadError,
  getFileStream,
  deleteBlob,
  getBlobMetadataCollection,
  blobCollectionSummary,
  getFileSizeLimit
}
