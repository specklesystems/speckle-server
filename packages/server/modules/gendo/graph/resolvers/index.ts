import { authorizeResolver } from '@/modules/shared'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { Roles } from '@speckle/shared'
import {
  getGendoAIAPIEndpoint,
  getGendoAIKey
} from '@/modules/shared/helpers/envHelper'
import {
  createGendoAIRenderRequest,
  getGendoAIRenderRequest,
  getGendoAIRenderRequests
} from '@/modules/gendo/services'
import crs from 'crypto-random-string'
import {
  ProjectSubscriptions,
  filteredSubscribe
} from '@/modules/shared/utils/subscriptions'

export = {
  Version: {
    async gendoAIRenders(parent, __args, __cxt) {
      const items = await getGendoAIRenderRequests(parent.id)
      return {
        totalCount: items.length,
        items
      }
    },
    async gendoAIRender(parent, args) {
      const item = await getGendoAIRenderRequest(parent.id, args.id)
      return item
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
        await createGendoAIRenderRequest({
          ...args.input,
          userId: ctx.userId as string,
          status: body.status,
          gendoGenerationId: body.generationId,
          id: crs({ length: 10 })
        })
      } else {
        const body = await response.json()
        await createGendoAIRenderRequest({
          ...args.input,
          userId: ctx.userId as string,
          status: 'ERROR',
          baseImage: body,
          id: crs({ length: 10 })
        })
      }
      return true
    }
  },
  Subscription: {
    projectVersionGendoAIRenderCreated: {
      subscribe: filteredSubscribe(
        ProjectSubscriptions.ProjectVersionGendoAIRenderCreated,
        async (payload, args, ctx) => {
          if (
            args.id !== payload.projectVersionGendoAIRenderCreated.projectId ||
            args.versionId !== payload.projectVersionGendoAIRenderCreated.versionId
          )
            return false

          await authorizeResolver(
            ctx.userId,
            args.id,
            Roles.Stream.Reviewer,
            ctx.resourceAccessRules
          )

          return true
        }
      )
    },
    projectVersionGendoAIRenderUpdated: {
      subscribe: filteredSubscribe(
        ProjectSubscriptions.ProjectVersionGendoAIRenderUpdated,
        async (payload, args, ctx) => {
          if (
            args.id !== payload.projectVersionGendoAIRenderUpdated.projectId ||
            args.versionId !== payload.projectVersionGendoAIRenderUpdated.versionId
          )
            return false

          await authorizeResolver(
            ctx.userId,
            args.id,
            Roles.Stream.Reviewer,
            ctx.resourceAccessRules
          )

          return true
        }
      )
    }
  }
} as Resolvers
