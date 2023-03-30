import { Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  getStreamFileUploads,
  getFileInfo,
  getStreamPendingModels,
  getBranchPendingVersions
} from '@/modules/fileuploads/repositories/fileUploads'

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
    async pendingImportedModels(parent) {
      return await getStreamPendingModels(parent.id)
    }
  },
  Model: {
    async pendingImportedVersions(parent) {
      return await getBranchPendingVersions(parent.streamId, parent.name)
    }
  },
  FileUpload: {
    projectId: (parent) => parent.streamId,
    modelName: (parent) => parent.branchName,
    convertedVersionId: (parent) => parent.convertedCommitId
  }
} as Resolvers
