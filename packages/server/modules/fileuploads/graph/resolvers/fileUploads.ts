import { Roles } from '@speckle/shared'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  getBranchPendingVersionsFactory,
  getFileInfoFactory,
  getStreamFileUploadsFactory,
  getStreamPendingModelsFactory
} from '@/modules/fileuploads/repositories/fileUploads'
import { authorizeResolver } from '@/modules/shared'
import {
  FileImportSubscriptions,
  filteredSubscribe
} from '@/modules/shared/utils/subscriptions'
import { getProjectDbClient } from '@/modules/multiregion/dbSelector'

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
