import { buildTableHelper } from '@/modules/core/dbSchema'
import {
  GetStoredViewCount,
  StoreSavedView
} from '@/modules/viewer/domain/operations/savedViews'
import { SavedView } from '@/modules/viewer/domain/types/savedViews'
import cryptoRandomString from 'crypto-random-string'
import { Knex } from 'knex'

const SavedViews = buildTableHelper('saved_views', [
  'id',
  'name',
  'description',
  'projectId',
  'authorId',
  'groupName',
  'resourceIds',
  'isHomeView',
  'visibility',
  'viewerState',
  'screenshot',
  'position',
  'createdAt',
  'updatedAt'
])

const tables = {
  savedViews: (db: Knex) => db<SavedView>(SavedViews.name)
}

export const storeSavedViewFactory =
  (deps: { db: Knex }): StoreSavedView =>
  async ({ view }) => {
    const [insertedItem] = await tables.savedViews(deps.db).insert(
      {
        id: cryptoRandomString({ length: 10 }),
        ...view
      },
      '*'
    )
    return insertedItem
  }

export const getStoredViewCountFactory =
  (deps: { db: Knex }): GetStoredViewCount =>
  async ({ projectId }) => {
    const [count] = await tables.savedViews(deps.db).where({ projectId }).count()
    return parseInt(count.count + '')
  }
