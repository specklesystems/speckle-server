const knex = require('@/db/knex')
const { deleteObject } = require('@/modules/assetstorage/objectStorage')
const {
  SpeckleNotFoundError,
  SpeckleResourceMismatch
} = require('@/modules/shared/errors')
const AssetStorage = () => knex('asset_storage')

const assetLookup = ({ fileId }) => AssetStorage().where({ id: fileId })

const uploadFileStream = async (
  storeFileStream,
  { streamId, userId },
  { fileId, fileName, fileType, fileStream }
) => {
  const objectKey = `assets/${streamId}/${fileId}`
  const dbFile = {
    id: fileId,
    streamId,
    userId,
    objectKey,
    fileName,
    fileType
  }
  // need to insert the upload data before starting otherwise the upload finished
  // even might fire faster, than the db insert, causing missing asset data in the db
  await AssetStorage().insert(dbFile)
  const { fileHash } = await storeFileStream({ objectKey, fileStream })
  return { fileId, fileName, fileHash }
}

const objectLookup = async ({ streamId, fileId }) => {
  const obj = (await assetLookup({ fileId }).first()) || null
  if (!obj)
    throw new SpeckleNotFoundError(`The requested asset: ${fileId} doesn't exist`)
  if (!streamId) throw new SpeckleResourceMismatch('No steamId provided')
  if (obj.streamId !== streamId)
    throw new SpeckleResourceMismatch("The stream doesn't have the given resource")
  return obj
}

const getFileStream = async ({ getObjectStream, streamId, fileId }) => {
  const { objectKey } = await objectLookup({ streamId, fileId })
  return await getObjectStream({ objectKey })
}

const markUploadSuccess = async (getObjectAttributes, streamId, fileId) =>
  await updateUpload(streamId, fileId, async ({ objectKey }) => {
    const { fileSize } = await getObjectAttributes({ objectKey })
    return { uploadStatus: 1, fileSize }
  })

const markUploadOverFileSizeLimit = async (deleteObject, streamId, fileId) =>
  await markUploadError(deleteObject, streamId, fileId, 'File size limit reached')

const markUploadError = async (deleteObject, streamId, fileId, error) =>
  await updateUpload(streamId, fileId, async ({ objectKey }) => {
    await deleteObject({ objectKey })
    return { uploadStatus: 2, uploadError: error }
  })

const deleteAsset = async ({ streamId, fileId }) => {
  const { objectKey } = await objectLookup({ streamId, fileId })
  await deleteObject({ objectKey })
  await assetLookup({ fileId }).del()
}

const updateUpload = async (streamId, fileId, updateCallback) => {
  const { objectKey, fileName } = await objectLookup({ streamId, fileId })
  const updateData = await updateCallback({ objectKey })
  await assetLookup({ fileId }).update(updateData)
  return { fileId, fileName, ...updateData }
}

module.exports = {
  objectLookup,
  uploadFileStream,
  markUploadSuccess,
  markUploadOverFileSizeLimit,
  markUploadError,
  getFileStream,
  deleteAsset
}
