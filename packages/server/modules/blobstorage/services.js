const knex = require('@/db/knex')
const { NotFoundError, ResourceMismatch } = require('@/modules/shared/errors')
const BlobStorage = () => knex('blob_storage')

const blobLookup = ({ blobId }) => BlobStorage().where({ id: blobId })

const uploadFileStream = async (
  storeFileStream,
  { streamId, userId },
  { blobId, fileName, fileType, fileStream }
) => {
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
  return { blobId, fileName, fileHash }
}

const getBlobMetadata = async ({ streamId, blobId }) => {
  const obj = (await blobLookup({ blobId }).first()) || null
  if (!obj) throw new NotFoundError(`The requested asset: ${blobId} doesn't exist`)
  if (!streamId) throw new ResourceMismatch('No steamId provided')
  if (obj.streamId !== streamId)
    throw new ResourceMismatch("The stream doesn't have the given resource")
  return obj
}

const blobQuery = ({ streamId, query }) => {
  let blobs = BlobStorage().where({ streamId })
  if (query) blobs = blobs.andWhereLike('fileName', `%${query}%`)
  return blobs
}

const getBlobMetadataCollection = async ({ streamId, query, limit, cursor }) => {
  const cursorTarget = 'createdAt'
  const limitMax = 25
  const queryLimit = limit && limit < limitMax ? limit : limitMax
  const blobs = blobQuery({ streamId, query })
    .orderBy(cursorTarget, 'desc')
    .limit(queryLimit)
  if (cursor) query.andWhere(cursorTarget, '<', cursor)

  const rows = await blobs
  return {
    blobs: rows,
    cursor: rows.length > 0 ? rows[rows.length - 1][cursorTarget].toISOString() : null
  }
}

const blobCollectionSummary = async ({ streamId, query }) => {
  const [summary] = await blobQuery({ streamId, query }).sum('fileSize').count('id')
  return { totalSize: summary.sum ?? 0, totalCount: summary.count }
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
