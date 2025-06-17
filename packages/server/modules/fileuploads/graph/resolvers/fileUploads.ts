import { Roles } from '@speckle/shared'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  getBranchPendingVersionsFactory,
  getFileInfoFactory,
  getModelUploadsItemsFactory,
  getModelUploadsTotalCountFactory,
  getStreamFileUploadsFactory,
  getStreamPendingModelsFactory
} from '@/modules/fileuploads/repositories/fileUploads'
import { authorizeResolver } from '@/modules/shared'
import {
  FileImportSubscriptions,
  filteredSubscribe
} from '@/modules/shared/utils/subscriptions'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { getModelUploadsFactory } from '@/modules/fileuploads/services/management'

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
    projectId: (parent) => parent.streamId,
    modelName: (parent) => parent.branchName,
    convertedVersionId: (parent) => parent.convertedCommitId,
    async model(parent, _args, ctx) {
      const { streamId, modelId, branchName } = parent

      const projectDb = await getProjectDbClient({ projectId: streamId })
      if (modelId) {
        return await ctx.loaders
          .forRegion({ db: projectDb })
          .branches.getById.load(modelId)
      }

      return await ctx.loaders
        .forRegion({ db: projectDb })
        .streams.getStreamBranchByName.forStream(streamId)
        .load(branchName.toLowerCase())
    }
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
