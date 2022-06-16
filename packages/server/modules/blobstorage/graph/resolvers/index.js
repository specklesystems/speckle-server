const {
  getBlobMetadata,
  getBlobMetadataCollection,
  blobCollectionSummary
} = require('@/modules/blobstorage/services')
const { NotFoundError, ResourceMismatch } = require('@/modules/shared/errors')
const { UserInputError } = require('apollo-server-errors')

module.exports = {
  Stream: {
    async blobs(parent, args) {
      const streamId = parent.id
      const [summary, blobs] = await Promise.all([
        blobCollectionSummary({
          streamId,
          query: args.query
        }),
        getBlobMetadataCollection({
          streamId,
          query: args.query,
          limit: args.limit,
          cursor: args.cursor
        })
      ])
      return {
        totalCount: summary.totalCount,
        totalSize: summary.totalSize,
        cursor: blobs.cursor,
        items: blobs.blobs
      }
    },
    async blob(parent, args) {
      try {
        return await getBlobMetadata({ streamId: parent.id, blobId: args.id })
      } catch (err) {
        if (err instanceof NotFoundError) return null
        if (err instanceof ResourceMismatch) throw new UserInputError(err.message)
        throw err
      }
    }
  }
}
