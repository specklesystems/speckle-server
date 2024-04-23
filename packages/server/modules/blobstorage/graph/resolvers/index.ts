import { BlobStorageRecord } from '@/modules/blobstorage/helpers/types'
import {
  getBlobMetadata,
  getBlobMetadataCollection,
  blobCollectionSummary,
  getFileSizeLimit
} from '@/modules/blobstorage/services'
import {
  ProjectBlobArgs,
  ProjectBlobsArgs,
  Resolvers,
  StreamBlobArgs,
  StreamBlobsArgs
} from '@/modules/core/graph/generated/graphql'
import {
  ProjectGraphQLReturn,
  StreamGraphQLReturn
} from '@/modules/core/helpers/graphTypes'
import { NotFoundError, ResourceMismatch } from '@/modules/shared/errors'
import { Nullable } from '@speckle/shared'
import { UserInputError } from 'apollo-server-errors'

const streamBlobResolvers = {
  async blobs(
    parent: StreamGraphQLReturn | ProjectGraphQLReturn,
    args: StreamBlobsArgs | ProjectBlobsArgs
  ) {
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
  async blob(
    parent: StreamGraphQLReturn | ProjectGraphQLReturn,
    args: StreamBlobArgs | ProjectBlobArgs
  ) {
    try {
      return (await getBlobMetadata({
        streamId: parent.id,
        blobId: args.id
      })) as Nullable<BlobStorageRecord>
    } catch (err: unknown) {
      if (err instanceof NotFoundError) return null
      if (err instanceof ResourceMismatch) throw new UserInputError(err.message)
      throw err
    }
  }
}

export = {
  ServerInfo: {
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
