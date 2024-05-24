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

      const endpoint = getGendoAIAPIEndpoint() as string
      const bearer = getGendoAIKey() as string
      // const webhookUrl = 'https://webhook.site/f03dd784-ec32-4bb2-8e60-07284281d36b'
      // const webhookUrl = 'https://directly-hardy-warthog.ngrok-free.app/api/thirdparty/gendo'
      const webhookUrl = `${process.env.CANONICAL_URL}/api/thirdparty/gendo`

      // TODO Fire off request to gendo api & get generationId, create record in db. Note: use gendo api key from env
      const gendoRequestBody = {
        userId: ctx.userId,
        depthMap: args.input.baseImage,
        prompt: args.input.prompt,
        webhookUrl
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bearer}`
        },
        body: JSON.stringify(gendoRequestBody)
      })

      const status = response.status

      if (status === 200) {
        const body = (await response.json()) as { status: string; generationId: string }
        const res = await createGendoAIRenderRequest({
          ...args.input,
          userId: ctx.userId as string,
          status: body.status,
          gendoGenerationId: body.generationId,
          id: crs({ length: 10 })
        })
      } else {
        // TODO
        console.log(await response.json())
      }

      // TODO Notify this happened
      return true
    }
  }
} as Resolvers
