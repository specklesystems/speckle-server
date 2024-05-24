import { authorizeResolver } from '@/modules/shared'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { Roles } from '@speckle/shared'
import {
  getGendoAIAPIEndpoint,
  getGendoAIKey
} from '@/modules/shared/helpers/envHelper'
import { createGendoAIRenderRequest } from '@/modules/gendo/services'
import crs from 'crypto-random-string'

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

      const log = { ...args.input, endpoint, bearer }
      delete log.baseImage
      console.log(log)

      // TODO Fire off request to gendo api & get generationId, create record in db. Note: use gendo api key from env

      const res = await createGendoAIRenderRequest({
        ...args.input,
        userId: ctx.userId as string,
        status: 'TEST',
        gendoGenerationId: '42',
        id: crs({ length: 10 })
      })

      console.log(res, 'gendo')
      // TODO Notify this happened
      return true
    }
  }
} as Resolvers
