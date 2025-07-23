import { buildTableHelper } from '@/modules/core/dbSchema'
import type {
  GetProjectSavedViewGroupsBaseParams,
  GetProjectSavedViewGroupsPageItems,
  GetProjectSavedViewGroupsTotalCount,
  GetStoredViewCount,
  StoreSavedView
} from '@/modules/viewer/domain/operations/savedViews'
import type {
  SavedView,
  SavedViewGroup
} from '@/modules/viewer/domain/types/savedViews'
import { DuplicateSavedViewError } from '@/modules/viewer/errors/savedViews'
import {
  buildSavedViewGroupId,
  NULL_GROUP_NAME_VALUE,
  savedGroupCursorUtils
} from '@/modules/viewer/helpers/savedViews'
import { ensureError } from '@speckle/shared'
import {
  isModelResource,
  isObjectResource,
  resourceBuilder
} from '@speckle/shared/viewer/route'
import cryptoRandomString from 'crypto-random-string'
import { type Knex } from 'knex'
import { clamp } from 'lodash-es'

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
    try {
      const [insertedItem] = await tables.savedViews(deps.db).insert(
        {
          id: cryptoRandomString({ length: 10 }),
          ...view
        },
        '*'
      )
      return insertedItem
    } catch (e) {
      if (
        ensureError(e).message.includes(
          'duplicate key value violates unique constraint'
        )
      ) {
        throw new DuplicateSavedViewError()
      }

      throw e
    }
  }

export const getStoredViewCountFactory =
  (deps: { db: Knex }): GetStoredViewCount =>
  async ({ projectId }) => {
    const [count] = await tables.savedViews(deps.db).where({ projectId }).count()
    return parseInt(count.count + '')
  }

const getProjectSavedViewGroupsBaseQuery =
  (deps: { db: Knex }) => (params: GetProjectSavedViewGroupsBaseParams) => {
    const { projectId, resourceIdString, onlyAuthored, search, userId } = params

    const q = tables
      .savedViews(deps.db)
      // Select groupName and 'cursor' which is coalesced groupName || NULL_GROUP_NAME_VALUE
      .select<Array<{ groupName: string | null; cursor: string }>>([
        SavedViews.col.groupName,
        deps.db.raw(`COALESCE(??, ?) as cursor`, [
          SavedViews.col.groupName,
          NULL_GROUP_NAME_VALUE
        ])
      ])
      .where({ [SavedViews.col.projectId]: projectId })

    // resourceIdString looks like: modelId, modelId@versionId, objectId etc.
    // We want to find all saved views that reference any of these resources
    const resourceIds = resourceBuilder()
      .addFromString(resourceIdString)
      .forEach((r) => {
        if (isModelResource(r)) {
          // not interested in the specific version ids originally used
          r.versionId = undefined
        }
      })
      .filter((r) => {
        // filter out any resources that are not ViewerModelResource or ViewerObjectResource
        return isModelResource(r) || isObjectResource(r)
      })
      .map((r) => r.toString())

    if (resourceIds.length) {
      // Col contains at least one of the resources
      q.whereRaw('?? && ?', [SavedViews.col.resourceIds, resourceIds])
    } else {
      // Make query exit early - no resources
      q.whereRaw('false')
    }

    if (onlyAuthored && userId) {
      q.where({ [SavedViews.col.authorId]: userId })
    }

    if (search) {
      q.where(SavedViews.col.name, 'ilike', `%${search}%`)
    }

    // Group by groupName (including NULL group) and ONLY select the groupNames
    q.groupBy(SavedViews.col.groupName, 'cursor').orderBy('cursor', 'asc')

    return { q, resourceIds }
  }

export const getProjectSavedViewGroupsTotalCountFactory =
  (deps: { db: Knex }): GetProjectSavedViewGroupsTotalCount =>
  async (params) => {
    const { q } = getProjectSavedViewGroupsBaseQuery(deps)(params)
    const countQ = deps.db.count<{ count: string }[]>().from(q.as('sq1'))
    const [count] = await countQ
    return parseInt(count.count + '')
  }

export const getProjectSavedViewGroupsPageItemsFactory =
  (deps: { db: Knex }): GetProjectSavedViewGroupsPageItems =>
  async (params) => {
    const { projectId } = params
    const { q, resourceIds } = getProjectSavedViewGroupsBaseQuery(deps)(params)
    const { encode, decode } = savedGroupCursorUtils()

    const limit = clamp(params.limit ?? 10, 0, 100)
    q.limit(limit)

    const cursor = decode(params.cursor)
    if (cursor) {
      q.whereRaw('?? > ?', [
        deps.db.raw(`COALESCE(??, ?)`, [
          SavedViews.col.groupName,
          NULL_GROUP_NAME_VALUE
        ]),
        cursor
      ])
    }

    const items = await q
    const groups: SavedViewGroup[] = items.map((item) => ({
      id: buildSavedViewGroupId({
        name: item.groupName,
        projectId,
        resourceIds
      }),
      groupName: item.groupName,
      projectId,
      resourceIds,
      name: item.groupName
    }))
    const lastItem = items.at(-1)
    const newCursor = lastItem ? encode({ name: lastItem.groupName }) : null

    return {
      items: groups,
      cursor: newCursor
    }
  }
