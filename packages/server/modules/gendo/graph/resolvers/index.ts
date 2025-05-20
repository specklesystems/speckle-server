import { authorizeResolver } from '@/modules/shared'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { Roles } from '@speckle/shared'
import { createRenderRequestFactory } from '@/modules/gendo/services'
import {
  ProjectSubscriptions,
  filteredSubscribe,
  publish
} from '@/modules/shared/utils/subscriptions'
import { throwIfRateLimitedFactory } from '@/modules/core/utils/ratelimiter'
import { uploadFileStreamFactory } from '@/modules/blobstorage/services/management'
import {
  updateBlobFactory,
  upsertBlobFactory
} from '@/modules/blobstorage/repositories'
import {
  getLatestVersionRenderRequestsFactory,
  getUserCreditsFactory,
  getVersionRenderRequestFactory,
  storeRenderFactory,
  upsertUserCreditsFactory
} from '@/modules/gendo/repositories'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { requestNewImageGenerationFactory } from '@/modules/gendo/clients/gendo'
import {
  getUserGendoAiCreditsFactory,
  useUserGendoAiCreditsFactory
} from '@/modules/gendo/services/userCredits'
import { db } from '@/db/knex'
import {
  getGendoAiApiEndpoint,
  getGendoAIKey,
  getGendoAICreditLimit,
  getServerOrigin,
  getFeatureFlags,
  isRateLimiterEnabled
} from '@/modules/shared/helpers/envHelper'
import { getProjectObjectStorage } from '@/modules/multiregion/utils/blobStorageSelector'
import { storeFileStreamFactory } from '@/modules/blobstorage/repositories/blobs'
import { withOperationLogging } from '@/observability/domain/businessLogging'

const upsertUserCredits = upsertUserCreditsFactory({ db })
const getUserGendoAiCredits = getUserGendoAiCreditsFactory({
  getUserCredits: getUserCreditsFactory({ db }),
  upsertUserCredits
})

const { FF_GENDOAI_MODULE_ENABLED } = getFeatureFlags()
const throwIfRateLimited = throwIfRateLimitedFactory({
  rateLimiterEnabled: isRateLimiterEnabled()
})

export = FF_GENDOAI_MODULE_ENABLED
  ? ({
      Version: {
        async gendoAIRenders(parent) {
          const projectDb = await getProjectDbClient({ projectId: parent.streamId })
          const items = await getLatestVersionRenderRequestsFactory({ db: projectDb })({
            versionId: parent.id
          })
          return {
            totalCount: items.length,
            items
          }
        },
        async gendoAIRender(parent, args) {
          const projectDb = await getProjectDbClient({ projectId: parent.streamId })
          const item = await getVersionRenderRequestFactory({ db: projectDb })({
            versionId: parent.id,
            id: args.id
          })

          return item
        }
      },
      GendoAIRender: {
        async user(parent, __args, ctx) {
          return await ctx.loaders.users.getUser.load(parent.userId)
        }
      },
      VersionMutations: {
        async requestGendoAIRender(__parent, args, ctx) {
          const projectId = args.input.projectId
          await throwIfRateLimited({
            action: 'GENDO_AI_RENDER_REQUEST',
            source: ctx.userId as string
          })

          await authorizeResolver(
            ctx.userId,
            projectId,
            Roles.Stream.Reviewer,
            ctx.resourceAccessRules
          )

          const logger = ctx.log.child({
            projectId,
            streamId: projectId //legacy
          })

          const userId = ctx.userId!

          const [projectDb, projectStorage] = await Promise.all([
            getProjectDbClient({
              projectId
            }),
            getProjectObjectStorage({ projectId })
          ])

          await useUserGendoAiCreditsFactory({
            getUserGendoAiCredits,
            upsertUserCredits,
            maxCredits: getGendoAICreditLimit()
          })({ userId, credits: 1 })

          const requestNewImageGeneration = requestNewImageGenerationFactory({
            endpoint: getGendoAiApiEndpoint(),
            serverOrigin: getServerOrigin(),
            token: getGendoAIKey()
          })

          const storeFileStream = storeFileStreamFactory({ storage: projectStorage })
          const createRenderRequest = createRenderRequestFactory({
            uploadFileStream: uploadFileStreamFactory({
              storeFileStream,
              upsertBlob: upsertBlobFactory({ db: projectDb }),
              updateBlob: updateBlobFactory({ db: projectDb })
            }),
            requestNewImageGeneration,
            storeRender: storeRenderFactory({ db: projectDb }),
            publish
          })

          await withOperationLogging(
            async () =>
              await createRenderRequest({
                ...args.input,
                userId
              }),
            {
              logger,
              operationName: 'createGendoRenderRequest',
              operationDescription: 'Request GendoAI to generate a render'
            }
          )

          return true
        }
      },
      User: {
        gendoAICredits: async (_parent, _args, ctx) => {
          const userCredits = await getUserGendoAiCredits({ userId: ctx.userId! })
          return {
            limit: getGendoAICreditLimit(),
            ...userCredits
          }
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
    } as Resolvers)
  : {}
