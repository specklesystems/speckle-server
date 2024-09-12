const knex = require('@/db/knex')
const { getBlobMetadataFactory } = require('@/modules/blobstorage/repositories')
const BlobStorage = () => knex('blob_storage')

const blobLookup = ({ blobId, streamId }) =>
  BlobStorage().where({ id: blobId, streamId })

const deleteBlob = async ({ streamId, blobId, deleteObject }) => {
  const { objectKey } = await getBlobMetadataFactory({ db: knex })({ streamId, blobId })
  await deleteObject({ objectKey })
  await blobLookup({ blobId, streamId }).del()
}

module.exports = {
  deleteBlob
}
