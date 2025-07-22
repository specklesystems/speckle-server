import { AccSyncItem } from '@/modules/acc/domain/types'
import { createAccSyncItemAndNotifyFactory } from '@/modules/acc/repositories/accSyncItems'
import { storeAutomationFactory } from '@/modules/automate/repositories/automations'
import { TokenResourceIdentifierType } from '@/modules/core/domain/tokens/types'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { LimitedUserGraphQLReturn } from '@/modules/core/helpers/graphTypes'
import { throwIfResourceAccessNotAllowed } from '@/modules/core/helpers/token'
import { getUsersFactory } from '@/modules/core/repositories/users'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'
import { getEventBus } from '@/modules/shared/services/eventBus'
import {
  filteredSubscribe,
  ProjectSubscriptions
} from '@/modules/shared/utils/subscriptions'
import { createTestAutomation } from '@/test/speckle-helpers/automationHelper'
import cryptoRandomString from 'crypto-random-string'
import { GraphQLError } from 'graphql/error'
import { Knex } from 'knex'

const ACC_SYNC_ITEMS = 'acc_sync_items'

const tables = {
  accSyncItems: (db: Knex) => db<AccSyncItem>(ACC_SYNC_ITEMS)
}

const resolvers: Resolvers = {
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
    accSyncItemMutations: () => ({} as unknown as any)
  },
  AccSyncItemMutations: {
    async create(parent, args, ctx) {
      const { input } = args
      throwIfResourceAccessNotAllowed({
        resourceId: input.projectId,
        resourceAccessRules: ctx.resourceAccessRules,
        resourceType: TokenResourceIdentifierType.Project
      })

      const projectDb = await getProjectDbClient({ projectId: input.projectId })

      const existing = await tables
        .accSyncItems(projectDb)
        .where({ accFileLineageId: input.accFileLineageId })
        .first()

      if (existing) {
        throw new GraphQLError(
          `A SyncItem with accFileLineageId "${input.accFileLineageId}" already exists.`,
          {
            extensions: { code: 'DUPLICATE_ACC_FILE_LINEAGE_ID' }
          }
        )
      }

      const createSyncItem = createAccSyncItemAndNotifyFactory({
        db: await getProjectDbClient({ projectId: input.projectId }),
        eventEmit: getEventBus().emit
      })

      // TODO ACC: Create automation at this step
      const automationId = cryptoRandomString({ length: 9 })

      await storeAutomationFactory({ db: projectDb })({
        id: automationId,
        name: "converter",
        userId: ctx.userId!,
        createdAt: new Date(),
        updatedAt: new Date(),
        enabled: true,
        projectId: input.projectId,
        executionEngineAutomationId: null,
        isTestAutomation: true,
        isDeleted: false
      })

      const newItem = await createSyncItem({
        id: cryptoRandomString({ length: 10 }),
        status: 'PENDING',
        authorId: ctx.userId as string,
        automationId,
        ...input
      })

      // TODO: Service function where we also create automation. (Include automation id in sync item record?)

      return newItem
    },
    async update(parent, args, ctx) {
      const { input } = args

      throwIfResourceAccessNotAllowed({
        resourceId: input.projectId,
        resourceAccessRules: ctx.resourceAccessRules,
        resourceType: TokenResourceIdentifierType.Project
      })

      const projectDB = await getProjectDbClient({ projectId: input.projectId })

      const [updated] = await tables
        .accSyncItems(projectDB)
        .where({ accFileLineageId: input.accFileLineageId })
        .update({
          status: input.status,
          updatedAt: new Date()
        })
        .returning('*')

      if (!updated) {
        throw new GraphQLError('Sync item not found for update', {
          extensions: { code: 'SYNC_ITEM_NOT_FOUND' }
        })
      }

      const getUser = getUsersFactory({ db: projectDB })
      const user = await getUser(ctx.userId as string)

      return {
        ...updated,
        author: user as unknown as LimitedUserGraphQLReturn
      }
    },
    async delete(parent, args, ctx) {
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
  },
  // TODO ACC: not working yet
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

          const accSyncItem = payload.projectAccSyncItemsUpdated.accSyncItem

          return (
            accSyncItem?.projectId === projectId &&
            (!itemIds || itemIds.includes(accSyncItem.accFileLineageId))
          )
        }
      )
    }
  }
}

export default resolvers
