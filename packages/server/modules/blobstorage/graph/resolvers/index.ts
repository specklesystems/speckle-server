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
import { getProjectDbClient } from '@/modules/multiregion/dbSelector'
import {
  BadRequestError,
  NotFoundError,
  ResourceMismatch
} from '@/modules/shared/errors'

const streamBlobResolvers = {
  async blobs(parent: StreamGraphQLReturn, args: StreamBlobsArgs | ProjectBlobsArgs) {
    const streamId = parent.id

    const projectDb = await getProjectDbClient({ projectId: parent.id })

    const blobCollectionSummary = blobCollectionSummaryFactory({ db: projectDb })
    const getBlobMetadataCollection = getBlobMetadataCollectionFactory({
      db: projectDb
    })

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
    const projectDb = await getProjectDbClient({ projectId: parent.id })
    const getBlobMetadata = getBlobMetadataFactory({ db: projectDb })
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
