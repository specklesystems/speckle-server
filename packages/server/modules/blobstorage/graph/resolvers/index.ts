import { db } from '@/db/knex'
import {
  blobCollectionSummaryFactory,
  getBlobMetadataCollectionFactory,
  getBlobMetadataFactory
} from '@/modules/blobstorage/repositories'
import { getFileSizeLimit } from '@/modules/blobstorage/services/management'
import {
  ProjectBlobArgs,
  ProjectBlobsArgs,
  Resolvers,
  StreamBlobArgs,
  StreamBlobsArgs
} from '@/modules/core/graph/generated/graphql'
import { StreamGraphQLReturn } from '@/modules/core/helpers/graphTypes'
import {
  BadRequestError,
  NotFoundError,
  ResourceMismatch
} from '@/modules/shared/errors'

const getBlobMetadata = getBlobMetadataFactory({ db })
const getBlobMetadataCollection = getBlobMetadataCollectionFactory({ db })
const blobCollectionSummary = blobCollectionSummaryFactory({ db })

const streamBlobResolvers = {
  async blobs(parent: StreamGraphQLReturn, args: StreamBlobsArgs | ProjectBlobsArgs) {
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
  async blob(parent: StreamGraphQLReturn, args: StreamBlobArgs | ProjectBlobArgs) {
    try {
      return await getBlobMetadata({
        streamId: parent.id,
        blobId: args.id
      })
    } catch (err: unknown) {
      if (err instanceof NotFoundError) return null
      if (err instanceof ResourceMismatch) throw new BadRequestError(err.message)
      throw err
    }
  }
}

export = {
  ServerInfo: {
    //deprecated
    blobSizeLimitBytes() {
      return getFileSizeLimit()
    }
  },
  ServerConfiguration: {
    blobSizeLimitBytes() {
      return getFileSizeLimit()
    }
  },
  Stream: {
    ...streamBlobResolvers
  },
  Project: {
    ...streamBlobResolvers
  }
} as Resolvers
