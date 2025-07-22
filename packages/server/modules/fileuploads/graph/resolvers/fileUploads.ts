import { TIME } from '@speckle/shared'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { db } from '@/db/knex'
import {
  getBranchPendingVersionsFactory,
  getFileInfoFactory,
  getFileInfoFactoryV2,
  getModelUploadsItemsFactory,
  getModelUploadsTotalCountFactory,
  getStreamFileUploadsFactory,
  getStreamPendingModelsFactory,
  saveUploadFileFactory,
  saveUploadFileFactoryV2,
  updateFileUploadFactory
} from '@/modules/fileuploads/repositories/fileUploads'
import {
  FileImportSubscriptions,
  filteredSubscribe
} from '@/modules/shared/utils/subscriptions'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import {
  BadRequestError,
  ForbiddenError,
  MisconfiguredEnvironmentError
} from '@/modules/shared/errors'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'
import {
  fileImportServiceShouldUsePrivateObjectsServerUrl,
  getFileUploadUrlExpiryMinutes,
  getPrivateObjectsServerOrigin,
  getServerOrigin,
  isFileUploadsEnabled
} from '@/modules/shared/helpers/envHelper'
import { getProjectObjectStorage } from '@/modules/multiregion/utils/blobStorageSelector'
import {
  getBlobFactory,
  updateBlobFactory,
  upsertBlobFactory
} from '@/modules/blobstorage/repositories'
import {
  getBlobMetadataFromStorage,
  getSignedUrlFactory
} from '@/modules/blobstorage/clients/objectStorage'
import { registerUploadCompleteAndStartFileImportFactory } from '@/modules/fileuploads/services/presigned'
import {
  generatePresignedUrlFactory,
  registerCompletedUploadFactory
} from '@/modules/blobstorage/services/presigned'
import { getEventBus } from '@/modules/shared/services/eventBus'
import {
  insertNewUploadAndNotifyFactory,
  insertNewUploadAndNotifyFactoryV2
} from '@/modules/fileuploads/services/management'
import {
  storeApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeTokenScopesFactory,
  storeUserServerAppTokenFactory
} from '@/modules/core/repositories/tokens'
import { createAppTokenFactory } from '@/modules/core/services/tokens'
import { fileImportQueues } from '@/modules/fileuploads/queues/fileimports'
import { pushJobToFileImporterFactory } from '@/modules/fileuploads/services/createFileImport'
import { getBranchesByIdsFactory } from '@/modules/core/repositories/branches'
import { getFileSizeLimit } from '@/modules/blobstorage/services/management'
import cryptoRandomString from 'crypto-random-string'
import { getFeatureFlags } from '@speckle/shared/environment'
import { throwIfResourceAccessNotAllowed } from '@/modules/core/helpers/token'
import { TokenResourceIdentifierType } from '@/modules/core/domain/tokens/types'
import { getModelUploadsFactory } from '@/modules/fileuploads/services/management'
import {
  FileUploadRecord,
  FileUploadRecordV2
} from '@/modules/fileuploads/helpers/types'
import { GraphQLContext } from '@/modules/shared/helpers/typeHelper'
import { onFileImportResultFactory } from '@/modules/fileuploads/services/resultHandler'
import {
  FileImportResultPayload,
  JobResultStatus
} from '@speckle/shared/workers/fileimport'

const { FF_LARGE_FILE_IMPORTS_ENABLED, FF_NEXT_GEN_FILE_IMPORTER_ENABLED } =
  getFeatureFlags()

const getFileUploadModel = async (params: {
  upload: FileUploadRecord | FileUploadRecordV2
  ctx: GraphQLContext
}) => {
  const { upload, ctx } = params
  const projectId = 'streamId' in upload ? upload.streamId : upload.projectId

  const projectDb = await getProjectDbClient({ projectId })
  if ('modelId' in upload && upload.modelId) {
    return await ctx.loaders
      .forRegion({ db: projectDb })
      .branches.getById.load(upload.modelId)
  }

  if ('branchName' in upload && upload.branchName) {
    return await ctx.loaders
      .forRegion({ db: projectDb })
      .streams.getStreamBranchByName.forStream(projectId)
      .load(upload.branchName.toLowerCase())
  }

  return null
}

const fileUploadMutations: Resolvers['FileUploadMutations'] = {
  async generateUploadUrl(_parent, args, ctx) {
    if (!FF_LARGE_FILE_IMPORTS_ENABLED) {
      throw new MisconfiguredEnvironmentError(
        'The large file import feature is not enabled on this server. Please contact your Speckle administrator.'
      )
    }
    const { projectId } = args.input
    if (!ctx.userId) {
      throw new ForbiddenError('No userId provided')
    }

    throwIfResourceAccessNotAllowed({
      resourceId: projectId,
      resourceType: TokenResourceIdentifierType.Project,
      resourceAccessRules: ctx.resourceAccessRules
    })

    const canImport = await ctx.authPolicies.project.canPublish({
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
        objectStorage: projectStorage.public
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
  async startFileImport(_parent, args, ctx) {
    const { projectId } = args.input
    if (!ctx.userId) {
      throw new ForbiddenError('No userId provided')
    }

    throwIfResourceAccessNotAllowed({
      resourceId: projectId,
      resourceType: TokenResourceIdentifierType.Project,
      resourceAccessRules: ctx.resourceAccessRules
    })

    const canImport = await ctx.authPolicies.project.canPublish({
      userId: ctx.userId,
      projectId
    })
    throwIfAuthNotOk(canImport)

    if (!isFileUploadsEnabled())
      throw new BadRequestError('File uploads are not enabled for this server')

    if (!FF_LARGE_FILE_IMPORTS_ENABLED) {
      throw new MisconfiguredEnvironmentError(
        'The large file import feature is not enabled on this server. Please contact your Speckle administrator.'
      )
    }

    const [projectDb, projectStorage] = await Promise.all([
      getProjectDbClient({ projectId }),
      getProjectObjectStorage({ projectId })
    ])

    const pushJobToFileImporter = pushJobToFileImporterFactory({
      getServerOrigin: fileImportServiceShouldUsePrivateObjectsServerUrl()
        ? getPrivateObjectsServerOrigin
        : getServerOrigin,
      createAppToken: createAppTokenFactory({
        storeApiToken: storeApiTokenFactory({ db }),
        storeTokenScopes: storeTokenScopesFactory({ db }),
        storeTokenResourceAccessDefinitions: storeTokenResourceAccessDefinitionsFactory(
          { db }
        ),
        storeUserServerAppToken: storeUserServerAppTokenFactory({ db })
      })
    })

    const insertNewUploadAndNotifyV2 = insertNewUploadAndNotifyFactoryV2({
      queues: fileImportQueues,
      pushJobToFileImporter,
      saveUploadFile: saveUploadFileFactoryV2({ db: projectDb }),
      emit: getEventBus().emit
    })

    const insertNewUploadAndNotify = insertNewUploadAndNotifyFactory({
      saveUploadFile: saveUploadFileFactory({ db: projectDb }),
      emit: getEventBus().emit
    })

    const registerUploadCompleteAndStartFileImport =
      registerUploadCompleteAndStartFileImportFactory({
        registerCompletedUpload: registerCompletedUploadFactory({
          logger: ctx.log,
          getBlob: getBlobFactory({ db: projectDb }),
          updateBlob: updateBlobFactory({
            db: projectDb
          }),
          getBlobMetadata: getBlobMetadataFromStorage({
            objectStorage: projectStorage.private
          })
        }),
        insertNewUploadAndNotify: FF_NEXT_GEN_FILE_IMPORTER_ENABLED
          ? insertNewUploadAndNotifyV2
          : insertNewUploadAndNotify,
        getFileInfo: getFileInfoFactoryV2({ db: projectDb }),
        getModelsByIds: getBranchesByIdsFactory({ db: projectDb })
      })

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
  },

  async completeFileImport(_parent, args, ctx) {
    const { projectId, jobId, status, warnings, reason, result } = args.input
    const userId = ctx.userId
    if (!userId) {
      throw new ForbiddenError('No userId provided')
    }

    if (!FF_NEXT_GEN_FILE_IMPORTER_ENABLED)
      throw new ForbiddenError('File import next gen is not enabled')

    let jobResult: FileImportResultPayload
    if (status === JobResultStatus.Error) {
      if (!reason) throw new BadRequestError('No error reason provided')

      jobResult = {
        status: JobResultStatus.Error,
        reason,
        result
      }
    } else {
      if (!result.versionId) throw new BadRequestError('VersionId not provided')

      jobResult = {
        status: JobResultStatus.Success,
        warnings,
        result: {
          ...result,
          versionId: result.versionId
        }
      }
    }

    const logger = ctx.log.child({
      projectId,
      streamId: projectId, //legacy
      userId,
      jobId
    })

    const projectDb = await getProjectDbClient({ projectId })
    const onFileImportResult = onFileImportResultFactory({
      logger: logger.child({ fileUploadStatus: status }),
      updateFileUpload: updateFileUploadFactory({ db: projectDb }),
      getFileInfo: getFileInfoFactoryV2({ db: projectDb }),
      eventEmit: getEventBus().emit
    })

    await onFileImportResult({
      jobId,
      jobResult
    })

    return true
  }
}

export default {
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
    },
    async uploads(parent, args) {
      const projectDb = await getProjectDbClient({ projectId: parent.streamId })
      const getModelUploads = getModelUploadsFactory({
        getModelUploadsItems: getModelUploadsItemsFactory({ db: projectDb }),
        getModelUploadsTotalCount: getModelUploadsTotalCountFactory({ db: projectDb })
      })

      return await getModelUploads({
        modelId: parent.id,
        projectId: parent.streamId,
        limit: args.input?.limit ?? 25,
        cursor: args.input?.cursor
      })
    }
  },
  FileUpload: {
    projectId: (parent) => ('streamId' in parent ? parent.streamId : parent.projectId),
    streamId: (parent) => ('streamId' in parent ? parent.streamId : parent.projectId),
    modelName: async (parent, _args, ctx) => {
      if ('branchName' in parent) return parent.branchName
      return (await getFileUploadModel({ upload: parent, ctx }))?.name
    },
    branchName: async (parent, _args, ctx) => {
      if ('branchName' in parent) return parent.branchName
      return (await getFileUploadModel({ upload: parent, ctx }))?.name
    },
    convertedVersionId: (parent) => parent.convertedCommitId,
    async model(parent, _args, ctx) {
      return await getFileUploadModel({ upload: parent, ctx })
    },
    updatedAt: (parent) => {
      return parent.convertedLastUpdate || parent.uploadDate
    }
  },
  Mutation: {
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

          throwIfResourceAccessNotAllowed({
            resourceId: payload.projectId,
            resourceType: TokenResourceIdentifierType.Project,
            resourceAccessRules: ctx.resourceAccessRules
          })
          const canRead = await ctx.authPolicies.project.canRead({
            userId: ctx.userId!,
            projectId: payload.projectId
          })
          throwIfAuthNotOk(canRead)

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

          throwIfResourceAccessNotAllowed({
            resourceId: payload.projectId,
            resourceType: TokenResourceIdentifierType.Project,
            resourceAccessRules: ctx.resourceAccessRules
          })
          const canRead = await ctx.authPolicies.project.canRead({
            userId: ctx.userId!,
            projectId: payload.projectId
          })
          throwIfAuthNotOk(canRead)

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

          throwIfResourceAccessNotAllowed({
            resourceId: payload.projectId,
            resourceType: TokenResourceIdentifierType.Project,
            resourceAccessRules: ctx.resourceAccessRules
          })
          const canRead = await ctx.authPolicies.project.canRead({
            userId: ctx.userId!,
            projectId: payload.projectId
          })
          throwIfAuthNotOk(canRead)

          return true
        }
      )
    }
  }
} as Resolvers
