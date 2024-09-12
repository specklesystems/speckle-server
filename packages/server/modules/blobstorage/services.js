const knex = require('@/db/knex')
const { getBlobMetadataFactory } = require('@/modules/blobstorage/repositories')
const { getFileSizeLimitMB } = require('@/modules/shared/helpers/envHelper')
const BlobStorage = () => knex('blob_storage')

const blobLookup = ({ blobId, streamId }) =>
  BlobStorage().where({ id: blobId, streamId })

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
  markUploadSuccess,
  markUploadOverFileSizeLimit,
  markUploadError,
  deleteBlob,
  getFileSizeLimit
}
