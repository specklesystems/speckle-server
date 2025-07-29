import {
  countAccSyncItemsFactory,
  deleteAccSyncItemByUrnFactory,
  getAccSyncItemByUrnFactory,
  listAccSyncItemsFactory,
  upsertAccSyncItemFactory
} from '@/modules/acc/repositories/accSyncItems'
import {
  createAccSyncItemFactory,
  deleteAccSyncItemFactory,
  getAccSyncItemFactory,
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
  storeAutomationFactory,
  storeAutomationRevisionFactory,
  storeAutomationTokenFactory
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
import { getUserFactory } from '@/modules/core/repositories/users'
import { validateStreamAccessFactory } from '@/modules/core/services/streams/access'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { authorizeResolver } from '@/modules/shared'
import { getGenericRedis } from '@/modules/shared/redis/redis'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { buildDecryptor } from '@/modules/shared/utils/libsodium'
import { db } from '@/db/knex'

const resolvers: Resolvers = {
  Mutation: {
    accSyncItemMutations: () => ({})
  },
  AccSyncItemMutations: {
    async create(_parent, args, ctx) {
      const { input } = args

      throwIfResourceAccessNotAllowed({
        resourceId: input.projectId,
        resourceAccessRules: ctx.resourceAccessRules,
        resourceType: TokenResourceIdentifierType.Project
      })

      const projectDb = await getProjectDbClient({ projectId: input.projectId })

      return await createAccSyncItemFactory({
        getAccSyncItemByUrn: getAccSyncItemByUrnFactory({ db: projectDb }),
        upsertAccSyncItem: upsertAccSyncItemFactory({ db: projectDb }),
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
        eventEmit: getEventBus().emit
      })({
        syncItem: input,
        creatorUserId: ctx.userId!
      })
    },
    async update(_parent, args, ctx) {
      const { input } = args

      throwIfResourceAccessNotAllowed({
        resourceId: input.projectId,
        resourceAccessRules: ctx.resourceAccessRules,
        resourceType: TokenResourceIdentifierType.Project
      })

      const projectDb = await getProjectDbClient({ projectId: input.projectId })

      return await updateAccSyncItemFactory({
        getAccSyncItemByUrn: getAccSyncItemByUrnFactory({ db: projectDb }),
        upsertAccSyncItem: upsertAccSyncItemFactory({ db: projectDb })
      })({
        syncItem: input
      })
    },
    async delete(_parent, args, ctx) {
      const { input } = args

      throwIfResourceAccessNotAllowed({
        resourceId: input.projectId,
        resourceAccessRules: ctx.resourceAccessRules,
        resourceType: TokenResourceIdentifierType.Project
      })

      const projectDb = await getProjectDbClient({ projectId: input.projectId })

      await deleteAccSyncItemFactory({
        deleteAccSyncItemByUrn: deleteAccSyncItemByUrnFactory({ db: projectDb })
      })

      return true
    }
  },
  AccSyncItem: {
    author: async (parent) => {
      return await getUserFactory({ db })(parent.authorId)
    }
  },
  Project: {
    async accSyncItems(parent, args, ctx) {
      const { cursor = null, limit = null } = args

      throwIfResourceAccessNotAllowed({
        resourceId: parent.id,
        resourceAccessRules: ctx.resourceAccessRules,
        resourceType: TokenResourceIdentifierType.Project
      })

      const projectDb = await getProjectDbClient({ projectId: parent.id })

      return await getPaginatedAccSyncItemsFactory({
        listAccSyncItems: listAccSyncItemsFactory({ db: projectDb }),
        countAccSyncItems: countAccSyncItemsFactory({ db: projectDb })
      })({
        projectId: parent.id,
        filter: {
          cursor,
          limit
        }
      })
    },
    async accSyncItem(parent, args, ctx) {
      const { lineageUrn } = args

      throwIfResourceAccessNotAllowed({
        resourceId: parent.id,
        resourceAccessRules: ctx.resourceAccessRules,
        resourceType: TokenResourceIdentifierType.Project
      })

      const projectDb = await getProjectDbClient({ projectId: parent.id })

      return await getAccSyncItemFactory({
        getAccSyncItemByUrn: getAccSyncItemByUrnFactory({ db: projectDb })
      })({ lineageUrn })
    }
  }

  // TODO ACC: not working yet
  // Subscription: {
  //   projectAccSyncItemsUpdated: {
  //     subscribe: filteredSubscribe(
  //       ProjectSubscriptions.ProjectAccSyncItemUpdated,
  //       async (payload, args, ctx) => {
  //         const { id: projectId, itemIds } = args

  //         if (payload.projectId !== projectId) return false

  //         throwIfResourceAccessNotAllowed({
  //           resourceAccessRules: ctx.resourceAccessRules,
  //           resourceId: projectId,
  //           resourceType: TokenResourceIdentifierType.Project
  //         })

  //         const canReadProject = await ctx.authPolicies.project.canRead({
  //           userId: ctx.userId,
  //           projectId
  //         })
  //         throwIfAuthNotOk(canReadProject)

  //         const accSyncItem = payload.projectAccSyncItemsUpdated.accSyncItem

  //         return (
  //           accSyncItem?.projectId === projectId &&
  //           (!itemIds || itemIds.includes(accSyncItem.accFileLineageUrn))
  //         )
  //       }
  //     )
  //   }
  // }
}

export default resolvers
