import { TokenResourceIdentifierType } from '@/modules/core/domain/tokens/types'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { throwIfResourceAccessNotAllowed } from '@/modules/core/helpers/token'
import { createSavedViewFactory } from '@/modules/viewer/services/savedViewsManagement'

const resolvers: Resolvers = {
  ProjectMutations: {
    savedViewMutations: () => ({})
  },
  SavedViewMutations: {
    createView: async (_parent, args, ctx) => {
      const projectId = args.input.projectId
      throwIfResourceAccessNotAllowed({
        resourceId: projectId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: ctx.resourceAccessRules
      })

      // TODO: Auth policy

      const createSavedView = createSavedViewFactory()
      return await createSavedView({ input: args.input, authorId: ctx.userId! })
    }
  }
}
export default resolvers
