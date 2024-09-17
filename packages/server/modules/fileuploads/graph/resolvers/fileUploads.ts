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
import { db } from '@/db/knex'

const getFileInfo = getFileInfoFactory({ db })
const getStreamFileUploads = getStreamFileUploadsFactory({ db })
const getStreamPendingModels = getStreamPendingModelsFactory({ db })
const getBranchPendingVersions = getBranchPendingVersionsFactory({ db })

export = {
  Stream: {
    async fileUploads(parent) {
      return await getStreamFileUploads({ streamId: parent.id })
    },
    async fileUpload(_parent, args) {
      return await getFileInfo({ fileId: args.id })
    }
  },
  Project: {
    async pendingImportedModels(parent, args) {
      return await getStreamPendingModels(parent.id, args)
    }
  },
  Model: {
    async pendingImportedVersions(parent, args) {
      return await getBranchPendingVersions(parent.streamId, parent.name, args)
    }
  },
  FileUpload: {
    projectId: (parent) => parent.streamId,
    modelName: (parent) => parent.branchName,
    convertedVersionId: (parent) => parent.convertedCommitId,
    async model(parent, _args, ctx) {
      return await ctx.loaders.streams.getStreamBranchByName
        .forStream(parent.streamId)
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
