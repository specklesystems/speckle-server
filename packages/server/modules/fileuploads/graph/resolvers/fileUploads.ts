import { Roles, TIME } from '@speckle/shared'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  getBranchPendingVersionsFactory,
  getFileInfoFactory,
  getFileInfoFactoryV2,
  getStreamFileUploadsFactory,
  getStreamPendingModelsFactory,
  saveUploadFileFactoryV2
} from '@/modules/fileuploads/repositories/fileUploads'
import { authorizeResolver } from '@/modules/shared'
import {
  FileImportSubscriptions,
  filteredSubscribe
} from '@/modules/shared/utils/subscriptions'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { GraphQLContext } from '@/modules/shared/helpers/typeHelper'
import {
  BadRequestError,
  ForbiddenError,
  MisconfiguredEnvironmentError
} from '@/modules/shared/errors'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'
import {
  getFileUploadUrlExpiryMinutes,
  getServerOrigin,
  isFileUploadsEnabled
} from '@/modules/shared/helpers/envHelper'
import { getProjectObjectStorage } from '@/modules/multiregion/utils/blobStorageSelector'
import {
  getBlobsFactory,
  updateBlobWhereStatusPendingFactory,
  upsertBlobFactory
} from '@/modules/blobstorage/repositories'
import {
  getBlobMetadataFromStorage,
  getSignedUrlFactory
} from '@/modules/blobstorage/clients/objectStorage'
import {
  FileUploadMutationsGenerateUploadUrlArgs,
  FileUploadMutationsStartFileImportArgs
} from '@/test/graphql/generated/graphql'
import { registerUploadCompleteAndStartFileImportFactory } from '@/modules/fileuploads/services/presigned'
import {
  generatePresignedUrlFactory,
  registerCompletedUploadFactory
} from '@/modules/blobstorage/services/presigned'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { insertNewUploadAndNotifyFactoryV2 } from '@/modules/fileuploads/services/management'
import {
  storeApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeTokenScopesFactory,
  storeUserServerAppTokenFactory
} from '@/modules/core/repositories/tokens'
import { createAppTokenFactory } from '@/modules/core/services/tokens'
import { scheduleJob } from '@/modules/fileuploads/queues/fileimports'
import { pushJobToFileImporterFactory } from '@/modules/fileuploads/services/createFileImport'
import { getBranchesByIdsFactory } from '@/modules/core/repositories/branches'
import { publish } from '@/modules/shared/utils/subscriptions'
import { getFileSizeLimit } from '@/modules/blobstorage/services/management'
import cryptoRandomString from 'crypto-random-string'
import { getFeatureFlags } from '@speckle/shared/environment'

const { FF_LARGE_FILE_IMPORTS_ENABLED } = getFeatureFlags()

const fileUploadMutations = {
  async generateUploadUrl(
    _parent: unknown,
    args: FileUploadMutationsGenerateUploadUrlArgs,
    ctx: GraphQLContext
  ) {
    if (!FF_LARGE_FILE_IMPORTS_ENABLED) {
      throw new MisconfiguredEnvironmentError(
        'The large file import feature is not enabled on this server. Please contact your Speckle administrator.'
      )
    }
    const { projectId } = args.input
    if (!ctx.userId) {
      throw new ForbiddenError('No userId provided')
    }
    const canImport = await ctx.authPolicies.project.files.canImport({
      userId: ctx.userId,
      projectId
    })
    throwIfAuthNotOk(canImport)

    if (!isFileUploadsEnabled())
      throw new BadRequestError('File uploads are not enabled for this server')

    const [projectDb, projectStorage] = await Promise.all([
      getProjectDbClient({ projectId }),
      getProjectObjectStorage({ projectId })
    ])

    const generatePresignedUrl = generatePresignedUrlFactory({
      getSignedUrl: getSignedUrlFactory({
        objectStorage: projectStorage
      }),
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
      urlExpiryDurationSeconds: getFileUploadUrlExpiryMinutes() * TIME.minute
    })

    return { url, fileId: blobId }
  },
  async startFileImport(
    _parent: unknown,
    args: FileUploadMutationsStartFileImportArgs,
    ctx: GraphQLContext
  ) {
    if (!FF_LARGE_FILE_IMPORTS_ENABLED) {
      throw new MisconfiguredEnvironmentError(
        'The large file import feature is not enabled on this server. Please contact your Speckle administrator.'
      )
    }

    const { projectId } = args.input
    if (!ctx.userId) {
      throw new ForbiddenError('No userId provided')
    }
    const canImport = await ctx.authPolicies.project.files.canImport({
      userId: ctx.userId,
      projectId
    })
    throwIfAuthNotOk(canImport)

    if (!isFileUploadsEnabled())
      throw new BadRequestError('File uploads are not enabled for this server')

    const [projectDb, projectStorage] = await Promise.all([
      getProjectDbClient({ projectId }),
      getProjectObjectStorage({ projectId })
    ])

    const pushJobToFileImporter = pushJobToFileImporterFactory({
      getServerOrigin,
      scheduleJob,
      createAppToken: createAppTokenFactory({
        storeApiToken: storeApiTokenFactory({ db: projectDb }),
        storeTokenScopes: storeTokenScopesFactory({ db: projectDb }),
        storeTokenResourceAccessDefinitions: storeTokenResourceAccessDefinitionsFactory(
          {
            db: projectDb
          }
        ),
        storeUserServerAppToken: storeUserServerAppTokenFactory({ db: projectDb })
      })
    })

    const insertNewUploadAndNotify = insertNewUploadAndNotifyFactoryV2({
      pushJobToFileImporter,
      saveUploadFile: saveUploadFileFactoryV2({ db: projectDb }),
      publish,
      emit: getEventBus().emit
    })

    const registerUploadCompleteAndStartFileImport =
      registerUploadCompleteAndStartFileImportFactory({
        registerCompletedUpload: registerCompletedUploadFactory({
          logger: ctx.log,
          getBlobs: getBlobsFactory({ db: projectDb }),
          updateBlobWhereStatusPending: updateBlobWhereStatusPendingFactory({
            db: projectDb
          }),
          getBlobMetadata: getBlobMetadataFromStorage({
            objectStorage: projectStorage
          })
        }),
        insertNewUploadAndNotify,
        getFileInfo: getFileInfoFactoryV2({ db: projectDb }),
        getModelsByIds: getBranchesByIdsFactory({ db: projectDb })
      })

    //TODO get the workspace plan and get a limit for the file size that can be uploaded
    const maximumFileSize = getFileSizeLimit()

    const uploadedFileData = await registerUploadCompleteAndStartFileImport({
      projectId: args.input.projectId,
      fileId: args.input.fileId,
      modelId: args.input.modelId,
      userId: ctx.userId,
      expectedETag: args.input.etag,
      maximumFileSize
    })

    return {
      ...uploadedFileData,
      streamId: uploadedFileData.projectId,
      branchName: uploadedFileData.modelName
    }
  }
}

export = {
  Stream: {
    async fileUploads(parent) {
      const projectDb = await getProjectDbClient({ projectId: parent.id })
      return await getStreamFileUploadsFactory({ db: projectDb })({
        streamId: parent.id
      })
    },
    async fileUpload(parent, args) {
      const projectDb = await getProjectDbClient({ projectId: parent.id })
      return await getFileInfoFactory({ db: projectDb })({ fileId: args.id })
    }
  },
  Project: {
    async pendingImportedModels(parent, args) {
      const projectDb = await getProjectDbClient({ projectId: parent.id })
      return await getStreamPendingModelsFactory({ db: projectDb })(parent.id, args)
    }
  },
  Model: {
    async pendingImportedVersions(parent, args) {
      const projectDb = await getProjectDbClient({ projectId: parent.streamId })
      return await getBranchPendingVersionsFactory({ db: projectDb })(
        parent.streamId,
        parent.name,
        args
      )
    }
  },
  FileUpload: {
    projectId: (parent) => parent.streamId,
    modelName: (parent) => parent.branchName,
    convertedVersionId: (parent) => parent.convertedCommitId,
    async model(parent, _args, ctx) {
      const projectDb = await getProjectDbClient({ projectId: parent.streamId })
      return await ctx.loaders
        .forRegion({ db: projectDb })
        .streams.getStreamBranchByName.forStream(parent.streamId)
        .load(parent.branchName.toLowerCase())
    }
  },
  Mutation: {
    //NOTE if editing this, see corresponding `FileUploadMutations` map in codegen.yml
    fileUploadMutations: () => ({})
  },
  FileUploadMutations: {
    ...fileUploadMutations
  },
  Subscription: {
    projectPendingModelsUpdated: {
      subscribe: filteredSubscribe(
        FileImportSubscriptions.ProjectPendingModelsUpdated,
        async (payload, args, ctx) => {
          const { id: projectId } = args
          if (payload.projectId !== projectId) return false

          await authorizeResolver(
            ctx.userId,
            projectId,
            Roles.Stream.Reviewer,
            ctx.resourceAccessRules
          )
          return true
        }
      )
    },
    projectPendingVersionsUpdated: {
      subscribe: filteredSubscribe(
        FileImportSubscriptions.ProjectPendingVersionsUpdated,
        async (payload, args, ctx) => {
          const { id: projectId } = args
          if (payload.projectId !== projectId) return false

          await authorizeResolver(
            ctx.userId,
            projectId,
            Roles.Stream.Reviewer,
            ctx.resourceAccessRules
          )
          return true
        }
      )
    },
    projectFileImportUpdated: {
      subscribe: filteredSubscribe(
        FileImportSubscriptions.ProjectFileImportUpdated,
        async (payload, args, ctx) => {
          const { id: projectId } = args
          if (payload.projectId !== projectId) return false

          await authorizeResolver(
            ctx.userId,
            projectId,
            Roles.Stream.Reviewer,
            ctx.resourceAccessRules
          )
          return true
        }
      )
    }
  }
} as Resolvers
