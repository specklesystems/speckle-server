import {
  getBlobMetadata,
  getBlobMetadataCollection,
  blobCollectionSummary,
  getFileSizeLimit
} from '@/modules/blobstorage/services'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { NotFoundError, ResourceMismatch } from '@/modules/shared/errors'
import { UserInputError } from 'apollo-server-errors'

export = {
  ServerInfo: {
    blobSizeLimitBytes() {
      return getFileSizeLimit()
    }
  },
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
      } catch (err: unknown) {
        if (err instanceof NotFoundError) return null
        if (err instanceof ResourceMismatch) throw new UserInputError(err.message)
        throw err
      }
    }
  }
} as Resolvers
