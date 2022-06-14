const {
  getBlobMetadata,
  getBlobMetadataCollection,
  blobCollectionSummary
} = require('../../services')
const {
  SpeckleNotFoundError,
  SpeckleResourceMismatch
} = require('@/modules/shared/errors')
const { UserInputError } = require('apollo-server-errors')

module.exports = {
  Stream: {
    async blobs(parent, args) {
      const streamId = parent.id
      const summary = await blobCollectionSummary({
        streamId,
        query: args.query
      })
      const blobs = await getBlobMetadataCollection({
        streamId,
        query: args.query,
        limit: args.limit,
        cursor: args.cursor
      })
      return {
        totalCount: summary.count,
        totalSize: summary.sum,
        cursor: blobs.cursor,
        items: blobs.blobs
      }
    },
    async blob(parent, args) {
      try {
        return await getBlobMetadata({ streamId: parent.id, blobId: args.id })
      } catch (err) {
        if (err instanceof SpeckleNotFoundError) return null
        if (err instanceof SpeckleResourceMismatch)
          throw new UserInputError(err.message)
        throw err
      }
    }
  }
}
