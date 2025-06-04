import {
  blobCollectionSummaryFactory,
  getBlobMetadataCollectionFactory,
  getBlobMetadataFactory,
  upsertBlobFactory
} from '@/modules/blobstorage/repositories'
import { getFileSizeLimit } from '@/modules/blobstorage/services/management'
import {
  BlobMutationsGenerateUploadUrlArgs,
  ProjectBlobArgs,
  ProjectBlobsArgs,
  Resolvers,
  StreamBlobArgs,
  StreamBlobsArgs
} from '@/modules/core/graph/generated/graphql'
import { StreamGraphQLReturn } from '@/modules/core/helpers/graphTypes'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ResourceMismatch
} from '@/modules/shared/errors'
import { generatePresignedUrlFactory } from '@/modules/blobstorage/services/presigned'
import { getProjectObjectStorage } from '@/modules/multiregion/utils/blobStorageSelector'
import { getSignedUrl } from '@/modules/blobstorage/clients/objectStorage'
import cryptoRandomString from 'crypto-random-string'
import { TIME } from '@speckle/shared'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'
import { GraphQLContext } from '@/modules/shared/helpers/typeHelper'

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

const blobMutations = {
  async generateUploadUrl(
    _parent: unknown,
    args: BlobMutationsGenerateUploadUrlArgs,
    ctx: GraphQLContext
  ) {
    const { projectId } = args.input
    if (!ctx.userId) {
      throw new ForbiddenError('No userId provided')
    }
    const canUpload = await ctx.authPolicies.project.blob.canUpload({
      userId: ctx.userId,
      projectId
    })
    throwIfAuthNotOk(canUpload)

    const [projectDb, projectStorage] = await Promise.all([
      getProjectDbClient({ projectId }),
      getProjectObjectStorage({ projectId })
    ])

    const generatePresignedUrl = generatePresignedUrlFactory({
      objectStorage: projectStorage,
      getSignedUrl,
      upsertBlob: upsertBlobFactory({
        db: projectDb
      })
    })
    const blobId = cryptoRandomString({ length: 10 })

    const url = await generatePresignedUrl({
      projectId: args.input.projectId,
      blobId,
      userId: ctx.userId,
      fileName: args.input.fileName,
      urlExpiryDurationSeconds: 10 * TIME.minute
    })

    return { url, blobId }
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
  },
  Mutation: {
    //NOTE if editing this, see corresponding `BlobMutations` map in codegen.yml
    blobMutations: () => ({})
  },
  BlobMutations: {
    ...blobMutations
  }
} as Resolvers
