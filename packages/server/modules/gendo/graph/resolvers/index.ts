import { authorizeResolver } from '@/modules/shared'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { Roles } from '@speckle/shared'
import {
  createRenderRequestFactory,
  getGendoAIRenderRequest
} from '@/modules/gendo/services'
import {
  ProjectSubscriptions,
  filteredSubscribe,
  publish
} from '@/modules/shared/utils/subscriptions'
import {
  getRateLimitResult,
  isRateLimitBreached
} from '@/modules/core/services/ratelimiter'
import { RateLimitError } from '@/modules/core/errors/ratelimit'
import { uploadFileStreamFactory } from '@/modules/blobstorage/services/management'
import {
  updateBlobFactory,
  upsertBlobFactory
} from '@/modules/blobstorage/repositories'
import { storeFileStream } from '@/modules/blobstorage/objectStorage'
import {
  getLatestVersionRenderRequestsFactory,
  storeRenderFactory
} from '@/modules/gendo/repositories'
import { db } from '@/db/knex'

const createRenderRequest = createRenderRequestFactory({
  uploadFileStream: uploadFileStreamFactory({
    upsertBlob: upsertBlobFactory({ db }),
    updateBlob: updateBlobFactory({ db })
  }),
  storeFileStream,
  storeRender: storeRenderFactory({ db }),
  publish,
  fetch
})
const getLatestVersionRenderRequests = getLatestVersionRenderRequestsFactory({ db })

export = {
  Version: {
    async gendoAIRenders(parent) {
      const items = await getLatestVersionRenderRequests({ versionId: parent.id })
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
      return response
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

      await createRenderRequest({
        ...args.input,
        userId: ctx.userId!
      })

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
