import {
  countAccSyncItemsFactory,
  deleteAccSyncItemByIdFactory,
  getAccSyncItemByIdFactory,
  listAccSyncItemsFactory,
  updateAccSyncItemStatusFactory,
  upsertAccSyncItemFactory
} from '@/modules/acc/repositories/accSyncItems'
import {
  createAccSyncItemFactory,
  deleteAccSyncItemFactory,
  getPaginatedAccSyncItemsFactory,
  updateAccSyncItemFactory
} from '@/modules/acc/services/management'
import {
  createAutomation,
  getFunctionReleaseFactory,
  getFunctionReleasesFactory
} from '@/modules/automate/clients/executionEngine'
import {
  getAutomationFactory,
  getAutomationTokenFactory,
  getLatestAutomationRevisionFactory,
  storeAutomationFactory,
  storeAutomationRevisionFactory,
  storeAutomationTokenFactory,
  upsertAutomationRunFactory
} from '@/modules/automate/repositories/automations'
import { createStoredAuthCodeFactory } from '@/modules/automate/services/authCode'
import {
  createAutomationFactory,
  createAutomationRevisionFactory
} from '@/modules/automate/services/automationManagement'
import {
  getEncryptionKeyPair,
  getFunctionInputDecryptorFactory
} from '@/modules/automate/services/encryption'
import { TokenResourceIdentifierType } from '@/modules/core/domain/tokens/types'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { throwIfResourceAccessNotAllowed } from '@/modules/core/helpers/token'
import { getBranchesByIdsFactory } from '@/modules/core/repositories/branches'
import { validateStreamAccessFactory } from '@/modules/core/services/streams/access'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { authorizeResolver } from '@/modules/shared'
import { getGenericRedis } from '@/modules/shared/redis/redis'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { buildDecryptor } from '@/modules/shared/utils/libsodium'
import { db } from '@/db/knex'
import { triggerSyncItemAutomationFactory } from '@/modules/acc/services/automate'
import { createAppTokenFactory } from '@/modules/core/services/tokens'
import {
  storeApiTokenFactory,
  storeTokenScopesFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeUserServerAppTokenFactory
} from '@/modules/core/repositories/tokens'
import {
  filteredSubscribe,
  ProjectSubscriptions
} from '@/modules/shared/utils/subscriptions'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'
import { AccModuleDisabledError, SyncItemNotFoundError } from '@/modules/acc/errors/acc'
import { getFeatureFlags } from '@speckle/shared/environment'
import type { AccRegion } from '@/modules/acc/domain/constants'

const { FF_ACC_INTEGRATION_ENABLED, FF_AUTOMATE_MODULE_ENABLED } = getFeatureFlags()

const enableAcc = FF_ACC_INTEGRATION_ENABLED && FF_AUTOMATE_MODULE_ENABLED

const resolvers: Resolvers = {
  Mutation: {
    accSyncItemMutations: () => ({})
  },
  AccSyncItemMutations: {
    async create(_parent, args, ctx) {
      const { input } = args

      const authResult = await ctx.authPolicies.project.canUpdateAccIntegrationSettings(
        {
          userId: ctx.userId,
          projectId: input.projectId
        }
      )
      throwIfAuthNotOk(authResult)
      throwIfResourceAccessNotAllowed({
        resourceId: input.projectId,
        resourceAccessRules: ctx.resourceAccessRules,
        resourceType: TokenResourceIdentifierType.Project
      })

      const projectDb = await getProjectDbClient({ projectId: input.projectId })

      return await createAccSyncItemFactory({
        upsertAccSyncItem: upsertAccSyncItemFactory({ db }),
        createAutomation: createAutomationFactory({
          createAuthCode: createStoredAuthCodeFactory({ redis: getGenericRedis() }),
          automateCreateAutomation: createAutomation,
          storeAutomation: storeAutomationFactory({ db: projectDb }),
          storeAutomationToken: storeAutomationTokenFactory({ db: projectDb }),
          eventEmit: getEventBus().emit
        }),
        createAutomationRevision: createAutomationRevisionFactory({
          getAutomation: getAutomationFactory({ db: projectDb }),
          storeAutomationRevision: storeAutomationRevisionFactory({ db: projectDb }),
          getBranchesByIds: getBranchesByIdsFactory({ db: projectDb }),
          getFunctionRelease: getFunctionReleaseFactory({ logger: ctx.log }),
          getEncryptionKeyPair,
          getFunctionInputDecryptor: getFunctionInputDecryptorFactory({
            buildDecryptor
          }),
          getFunctionReleases: getFunctionReleasesFactory({ logger: ctx.log }),
          eventEmit: getEventBus().emit,
          validateStreamAccess: validateStreamAccessFactory({ authorizeResolver })
        }),
        triggerSyncItemAutomation: triggerSyncItemAutomationFactory({
          updateAccSyncItemStatus: updateAccSyncItemStatusFactory({ db }),
          getAutomation: getAutomationFactory({ db: projectDb }),
          getLatestAutomationRevision: getLatestAutomationRevisionFactory({
            db: projectDb
          }),
          upsertAutomationRun: upsertAutomationRunFactory({ db: projectDb }),
          createAppToken: createAppTokenFactory({
            storeApiToken: storeApiTokenFactory({ db }),
            storeTokenScopes: storeTokenScopesFactory({ db }),
            storeTokenResourceAccessDefinitions:
              storeTokenResourceAccessDefinitionsFactory({
                db
              }),
            storeUserServerAppToken: storeUserServerAppTokenFactory({ db })
          }),
          getAutomationToken: getAutomationTokenFactory({
            db: projectDb
          })
        }),
        eventEmit: getEventBus().emit
      })({
        syncItem: {
          ...input,
          accRegion: input.accRegion as AccRegion
        },
        creatorUserId: ctx.userId!
      })
    },
    async update(_parent, args, ctx) {
      const { input } = args

      const authResult = await ctx.authPolicies.project.canUpdateAccIntegrationSettings(
        {
          userId: ctx.userId,
          projectId: input.projectId
        }
      )
      throwIfAuthNotOk(authResult)
      throwIfResourceAccessNotAllowed({
        resourceId: input.projectId,
        resourceAccessRules: ctx.resourceAccessRules,
        resourceType: TokenResourceIdentifierType.Project
      })

      return await updateAccSyncItemFactory({
        getAccSyncItemById: getAccSyncItemByIdFactory({ db }),
        upsertAccSyncItem: upsertAccSyncItemFactory({ db }),
        eventEmit: getEventBus().emit
      })({
        syncItem: input
      })
    },
    async delete(_parent, args, ctx) {
      const { input } = args

      const authResult = await ctx.authPolicies.project.canUpdateAccIntegrationSettings(
        {
          userId: ctx.userId,
          projectId: input.projectId
        }
      )
      throwIfAuthNotOk(authResult)
      throwIfResourceAccessNotAllowed({
        resourceId: input.projectId,
        resourceAccessRules: ctx.resourceAccessRules,
        resourceType: TokenResourceIdentifierType.Project
      })

      await deleteAccSyncItemFactory({
        deleteAccSyncItemById: deleteAccSyncItemByIdFactory({ db }),
        eventEmit: getEventBus().emit
      })({
        id: input.id,
        projectId: input.projectId
      })

      return true
    }
  },
  AccSyncItem: {
    author: async (parent, _args, context) => {
      return await context.loaders.users.getUser.load(parent.authorId)
    }
  },
  Project: {
    async accSyncItems(parent, args, ctx) {
      const { cursor = null, limit = null } = args

      const authResult = await ctx.authPolicies.project.canReadAccIntegrationSettings({
        userId: ctx.userId,
        projectId: parent.id
      })
      throwIfAuthNotOk(authResult)
      throwIfResourceAccessNotAllowed({
        resourceId: parent.id,
        resourceAccessRules: ctx.resourceAccessRules,
        resourceType: TokenResourceIdentifierType.Project
      })

      return await getPaginatedAccSyncItemsFactory({
        listAccSyncItems: listAccSyncItemsFactory({ db }),
        countAccSyncItems: countAccSyncItemsFactory({ db })
      })({
        projectId: parent.id,
        filter: {
          cursor,
          limit
        }
      })
    },
    async accSyncItem(parent, args, ctx) {
      const { id } = args

      const authResult = await ctx.authPolicies.project.canReadAccIntegrationSettings({
        userId: ctx.userId,
        projectId: parent.id
      })
      throwIfAuthNotOk(authResult)
      throwIfResourceAccessNotAllowed({
        resourceId: parent.id,
        resourceAccessRules: ctx.resourceAccessRules,
        resourceType: TokenResourceIdentifierType.Project
      })

      const syncItem = await ctx.loaders.acc.getAccSyncItem.load(id)

      if (!syncItem) {
        throw new SyncItemNotFoundError()
      }

      return syncItem
    }
  },
  Subscription: {
    projectAccSyncItemsUpdated: {
      subscribe: filteredSubscribe(
        ProjectSubscriptions.ProjectAccSyncItemUpdated,
        async (payload, args, ctx) => {
          const { id: projectId, itemIds } = args
          if (payload.projectId !== projectId) return false

          throwIfResourceAccessNotAllowed({
            resourceAccessRules: ctx.resourceAccessRules,
            resourceId: projectId,
            resourceType: TokenResourceIdentifierType.Project
          })

          const canReadProject = await ctx.authPolicies.project.canRead({
            userId: ctx.userId,
            projectId
          })
          throwIfAuthNotOk(canReadProject)

          if (!itemIds?.length) return true
          return itemIds.includes(payload.projectAccSyncItemsUpdated.id)
        }
      )
    }
  }
}

const disabledResolvers: Resolvers = {
  Mutation: {
    accSyncItemMutations: () => ({})
  },
  AccSyncItemMutations: {
    async create() {
      throw new AccModuleDisabledError()
    },
    async update() {
      throw new AccModuleDisabledError()
    },
    async delete() {
      throw new AccModuleDisabledError()
    }
  },
  Project: {
    async accSyncItem() {
      throw new AccModuleDisabledError()
    },
    async accSyncItems() {
      throw new AccModuleDisabledError()
    }
  },
  Subscription: {
    projectAccSyncItemsUpdated: {
      subscribe: filteredSubscribe(
        ProjectSubscriptions.ProjectAccSyncItemUpdated,
        async () => false
      )
    }
  }
}

export default enableAcc ? resolvers : disabledResolvers
