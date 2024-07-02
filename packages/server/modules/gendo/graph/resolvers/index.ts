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
import { GendoAiRender } from '@/test/graphql/generated/graphql'
import {
  getRateLimitResult,
  isRateLimitBreached
} from '@/modules/core/services/ratelimiter'
import { RateLimitError } from '@/modules/core/errors/ratelimit'
import { GendoRenderRequestError } from '@/modules/gendo/errors/main'

export = {
  Version: {
    async gendoAIRenders(parent) {
      const items = await getGendoAIRenderRequests(parent.id)
      return {
        totalCount: items.length,
        items
      }
    },
    async gendoAIRender(parent, args) {
      const item = await getGendoAIRenderRequest(parent.id, args.id)
      const response = {
        ...item,
        user: { name: item.userName, avatar: item.userAvatar, id: item.userId }
      }
      return response as GendoAiRender
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

      const rateLimitResult = await getRateLimitResult(
        'GENDO_AI_RENDER_REQUEST',
        ctx.userId as string
      )
      if (isRateLimitBreached(rateLimitResult)) {
        throw new RateLimitError(rateLimitResult)
      }

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
        const body = await response.json().catch(() => '')
        throw new GendoRenderRequestError('Failed to enque gendo render. ' + body)
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
