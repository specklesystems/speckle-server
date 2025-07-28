import type { AccSyncItem } from '@/modules/acc/domain/types'
import {
  getAccSyncItemByUrnFactory,
  upsertAccSyncItemFactory
} from '@/modules/acc/repositories/accSyncItems'
import {
  createAccSyncItemFactory,
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
import type { LimitedUserGraphQLReturn } from '@/modules/core/helpers/graphTypes'
import { throwIfResourceAccessNotAllowed } from '@/modules/core/helpers/token'
import { getBranchesByIdsFactory } from '@/modules/core/repositories/branches'
import { getUserFactory, getUsersFactory } from '@/modules/core/repositories/users'
import { validateStreamAccessFactory } from '@/modules/core/services/streams/access'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { authorizeResolver } from '@/modules/shared'
import { getGenericRedis } from '@/modules/shared/redis/redis'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { buildDecryptor } from '@/modules/shared/utils/libsodium'
import { GraphQLError } from 'graphql/error'
import type { Knex } from 'knex'
import { db } from '@/db/knex'
import { AccSyncItems } from '@/modules/acc/dbSchema'

const tables = {
  accSyncItems: (db: Knex) => db<AccSyncItem>(AccSyncItems.name)
}

const resolvers: Resolvers = {
  AccSyncItem: {
    author: async (parent) => {
      return await getUserFactory({ db })(parent.authorId)
    }
  },
  Project: {
    async accSyncItems(parent, args, ctx) {
      throwIfResourceAccessNotAllowed({
        resourceId: parent.id,
        resourceAccessRules: ctx.resourceAccessRules,
        resourceType: TokenResourceIdentifierType.Project
      })

      const projectDB = await getProjectDbClient({ projectId: parent.id })

      const items = await tables
        .accSyncItems(projectDB)
        .where({ projectId: parent.id })
        .orderBy('createdAt', 'desc')

      const authorIds = [...new Set(items.map((i) => i.authorId).filter(Boolean))]

      const getUser = getUsersFactory({ db: projectDB })
      const authors = await Promise.all(authorIds.map((id) => getUser(id)))
      const authorsMap = Object.fromEntries(authors.map((u) => [u[0].id, u]))

      return {
        totalCount: items.length,
        cursor: null, // TODO
        items: items.map((item) => ({
          ...item,
          author: authorsMap[item.authorId][0] || null
        }))
      }
    },
    async accSyncItem(parent, args, ctx) {
      const { id } = args

      throwIfResourceAccessNotAllowed({
        resourceId: parent.id,
        resourceAccessRules: ctx.resourceAccessRules,
        resourceType: TokenResourceIdentifierType.Project
      })

      // Get project-scoped DB
      const projectDB = await getProjectDbClient({ projectId: parent.id })
      const item = await tables.accSyncItems(projectDB).where({ id }).first()

      if (!item) throw new Error(`SyncItem with id "${id}" not found`) // TODO: create acc kind error types later

      const getUser = getUsersFactory({ db: projectDB })
      const user = await getUser(ctx.userId as string)
      return {
        ...item,
        author: user as unknown as LimitedUserGraphQLReturn
      }
    }
  },
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
        syncItem: args.input
      })
    },
    async delete(_parent, args, ctx) {
      const { input } = args

      throwIfResourceAccessNotAllowed({
        resourceId: input.projectId,
        resourceAccessRules: ctx.resourceAccessRules,
        resourceType: TokenResourceIdentifierType.Project
      })

      const projectDB = await getProjectDbClient({ projectId: input.projectId })

      const deleted = await tables
        .accSyncItems(projectDB)
        .where({ accFileLineageId: input.accFileLineageId })
        .del()

      if (deleted === 0) {
        throw new GraphQLError('Sync item not found for delete', {
          extensions: { code: 'SYNC_ITEM_NOT_FOUND' }
        })
      }

      return true
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
  //           (!itemIds || itemIds.includes(accSyncItem.accFileLineageId))
  //         )
  //       }
  //     )
  //   }
  // }
}

export default resolvers
