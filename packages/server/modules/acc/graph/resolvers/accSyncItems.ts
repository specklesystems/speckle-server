import { AccSyncItem } from '@/modules/acc/helpers/types'
import { createAccSyncItemAndNotifyFactory } from '@/modules/acc/repositories/accSyncItems'
import { TokenResourceIdentifierType } from '@/modules/core/domain/tokens/types'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { throwIfResourceAccessNotAllowed } from '@/modules/core/helpers/token'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { getEventBus } from '@/modules/shared/services/eventBus'
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

      return {
        totalCount: items.length,
        cursor: null, // TODO
        items: items.map((item) => ({
          ...item,
          author: null // TODO
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

      return {
        ...item,
        author: null // TODO
      }
    }
  },
  Mutation: {
    accSyncItemMutations: () => ({})
  },
  AccSyncItemMutations: {
    async create(parent, args, ctx) {
      const { input } = args
      console.log('create', input)
      throwIfResourceAccessNotAllowed({
        resourceId: input.projectId,
        resourceAccessRules: ctx.resourceAccessRules,
        resourceType: TokenResourceIdentifierType.Project
      })

      const projectDB = await getProjectDbClient({ projectId: input.projectId })

      const existing = await tables
        .accSyncItems(projectDB)
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

      const newItem = await createSyncItem({
        id: cryptoRandomString({ length: 10 }),
        status: 'SYNCING',
        ...input
      })

      return newItem
    }
    // async update(parent, args, ctx) {
    //   console.log('update', args)
    // },
    // async delete(parent, args, ctx) {
    //   console.log('delete', args)
    // }
  }
}

export default resolvers
