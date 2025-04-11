import { defineModuleLoaders } from '@/modules/loaders'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'

export default defineModuleLoaders(async () => {
  return {
    getComment: async ({ commentId, projectId }, { dataLoaders }) => {
      const db = await getProjectDbClient({ projectId })
      const comment = await dataLoaders
        .forRegion({ db })
        .comments.getComment.load(commentId)
      if (!comment) return null

      return {
        ...comment,
        projectId
      }
    }
  }
})
