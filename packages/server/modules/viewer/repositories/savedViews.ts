import { buildTableHelper } from '@/modules/core/dbSchema'
import { StoreSavedView } from '@/modules/viewer/domain/operations/savedViews'
import { SavedView } from '@/modules/viewer/domain/types/savedViews'
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

export const storeViewFactory =
  (deps: { db: Knex }): StoreSavedView =>
  async ({ view }) => {
    const [insertedItem] = await tables.savedViews(deps.db).insert(view, '*')
    return insertedItem
  }
