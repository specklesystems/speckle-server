import { authorizeResolver } from '@/modules/shared'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { Roles } from '@speckle/shared'
import {
  getGendoAIAPIEndpoint,
  getGendoAIKey
} from '@/modules/shared/helpers/envHelper'

export = {
  Version: {
    async gendoAIRenders() {
      // TODO
      return {
        totalCount: 0,
        items: []
      }
    }
  },
  VersionMutations: {
    async requestGendoAIRender(__parent, args, ctx) {
      await authorizeResolver(
        ctx.userId,
        args.input.projectId,
        Roles.Stream.Reviewer,
        ctx.resourceAccessRules
      )

      const endpoint = getGendoAIAPIEndpoint()
      const bearer = getGendoAIKey()

      console.log('hello')
      // TODO Fire off request to gendo api & get generationId, create record in db. Note: use gendo api key from env
      // TODO Notify this happened
      return true
    }
  }
} as Resolvers
