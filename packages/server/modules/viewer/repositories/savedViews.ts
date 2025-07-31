import { buildTableHelper } from '@/modules/core/dbSchema'
import { compositeCursorTools } from '@/modules/shared/helpers/dbHelper'
import type {
  GetGroupSavedViewsBaseParams,
  GetGroupSavedViewsPageItems,
  GetGroupSavedViewsTotalCount,
  GetProjectSavedViewGroupsBaseParams,
  GetProjectSavedViewGroupsPageItems,
  GetProjectSavedViewGroupsTotalCount,
  GetSavedViewGroup,
  GetStoredViewCount,
  RecalculateGroupResourceIds,
  StoreSavedView,
  StoreSavedViewGroup
} from '@/modules/viewer/domain/operations/savedViews'
import {
  SavedViewVisibility,
  type SavedView,
  type SavedViewGroup
} from '@/modules/viewer/domain/types/savedViews'
import {
  buildDefaultGroupId,
  decodeDefaultGroupId
} from '@/modules/viewer/helpers/savedViews'
import {
  isModelResource,
  isObjectResource,
  resourceBuilder
} from '@speckle/shared/viewer/route'
import cryptoRandomString from 'crypto-random-string'
import dayjs from 'dayjs'
import { type Knex } from 'knex'
import { clamp } from 'lodash-es'

const SavedViews = buildTableHelper('saved_views', [
  'id',
  'name',
  'description',
  'projectId',
  'authorId',
  'groupId',
  'resourceIds',
  'isHomeView',
  'visibility',
  'viewerState',
  'screenshot',
  'position',
  'createdAt',
  'updatedAt'
])

const SavedViewGroups = buildTableHelper('saved_view_groups', [
  'id',
  'authorId',
  'projectId',
  'resourceIds',
  'name',
  'createdAt',
  'updatedAt'
])

const savedGroupCursorUtils = () =>
  compositeCursorTools({
    schema: SavedViewGroups,
    cols: ['updatedAt', 'id']
  })

const generateId = () => cryptoRandomString({ length: 10 })

const buildDefaultGroup = (params: {
  resourceIds: string[]
  projectId: string
}): SavedViewGroup => {
  const { resourceIds, projectId } = params

  return {
    id: buildDefaultGroupId({ projectId, resourceIds }),
    authorId: null,
    projectId,
    resourceIds,
    name: null,
    createdAt: dayjs(0).toDate(),
    updatedAt: dayjs(0).toDate()
  }
}

const tables = {
  savedViews: (db: Knex) => db<SavedView>(SavedViews.name),
  savedViewGroups: (db: Knex) => db<SavedViewGroup>(SavedViewGroups.name)
}

export const storeSavedViewFactory =
  (deps: { db: Knex }): StoreSavedView =>
  async ({ view }) => {
    const [insertedItem] = await tables.savedViews(deps.db).insert(
      {
        id: generateId(),
        ...view
      },
      '*'
    )
    return insertedItem
  }

export const storeSavedViewGroupFactory =
  (deps: { db: Knex }): StoreSavedViewGroup =>
  async ({ group }) => {
    const [insertedItem] = await tables.savedViewGroups(deps.db).insert(
      {
        id: generateId(),
        ...group
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

const cleanLookupResourceIdString = (resourceIdString: string) => {
  // resourceIdString looks like: modelId, modelId@versionId, objectId etc.
  // We want to find all saved views that reference any of these resources
  return resourceBuilder()
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
}

const getProjectSavedViewGroupsBaseQueryFactory =
  (deps: { db: Knex }) => async (params: GetProjectSavedViewGroupsBaseParams) => {
    const { projectId, resourceIdString, search, userId } = params
    const onlyAuthored = params.onlyAuthored && userId
    const isFiltering = search || onlyAuthored
    const resourceIds = cleanLookupResourceIdString(resourceIdString)

    /**
     * When looking for default group items, the group doesn't exist, so we have to apply
     * the same filters to the views table instead
     */
    const applyFilters = (query: Knex.QueryBuilder, mode: 'view' | 'group') => {
      const isGroupQuery = mode === 'group'
      const isViewQuery = mode === 'view'

      if (isViewQuery) {
        // empty groupId - we're looking for ungrouped views only
        query.andWhere({
          [SavedViews.col.groupId]: null
        })
      }

      // group's or view's authorId
      query.andWhere({
        [isGroupQuery ? SavedViewGroups.col.projectId : SavedViews.col.projectId]:
          projectId
      })

      // group's or view's resourceIds
      if (resourceIds.length) {
        // Col contains at least one of the resources
        query.andWhereRaw('?? && ?', [
          isGroupQuery ? SavedViewGroups.col.resourceIds : SavedViews.col.resourceIds,
          resourceIds
        ])
      } else {
        // Make query exit early - no resources
        query.andWhereRaw('false')
      }

      // checking authored only on views (in case of groups, they're joined on)
      if (onlyAuthored) {
        query.andWhere({ [SavedViews.col.authorId]: userId })
      } else if (mode === 'view') {
        query.andWhere((w1) => {
          w1.andWhere(SavedViews.col.visibility, SavedViewVisibility.public)
          if (userId) {
            w1.orWhere(SavedViews.col.authorId, userId)
          }
        })
      }

      // checking search only on views
      if (search) {
        query.andWhere(SavedViews.col.name, 'ilike', `%${search}%`)
      }

      return query
    }

    const q = tables
      .savedViewGroups(deps.db)
      .select<SavedViewGroup[]>(SavedViewGroups.cols)

    if (isFiltering) {
      q.innerJoin(SavedViews.name, SavedViews.col.groupId, SavedViewGroups.col.id)
    }

    applyFilters(q, 'group')

    // Group by groupId
    q.groupBy(SavedViewGroups.col.id)

    /**
     * If filtering, then we need to check if default group should be shown. If not, always shown on first page
     * (2nd query could be avoided w/ a FULL OUTER JOIN, but it could get even more complicated)
     */
    const ungroupedViewFound = isFiltering
      ? await applyFilters(tables.savedViews(deps.db), 'view').first()
      : null
    const includeDefaultGroup = Boolean(!isFiltering || ungroupedViewFound)

    return { q, resourceIds, isFiltering, includeDefaultGroup }
  }

export const getProjectSavedViewGroupsTotalCountFactory =
  (deps: { db: Knex }): GetProjectSavedViewGroupsTotalCount =>
  async (params) => {
    const { q, includeDefaultGroup } = await getProjectSavedViewGroupsBaseQueryFactory(
      deps
    )(params)
    const countQ = deps.db.count<{ count: string }[]>().from(q.as('sq1'))
    const [count] = await countQ

    const numberCount = parseInt(count.count + '') + (includeDefaultGroup ? 1 : 0)
    return numberCount
  }

export const getProjectSavedViewGroupsPageItemsFactory =
  (deps: { db: Knex }): GetProjectSavedViewGroupsPageItems =>
  async (params) => {
    const { projectId } = params
    const { q, resourceIds, includeDefaultGroup } =
      await getProjectSavedViewGroupsBaseQueryFactory(deps)(params)
    const { applyCursorSortAndFilter, resolveNewCursor } = savedGroupCursorUtils()

    const limit = clamp(params.limit ?? 10, 0, 100)
    q.limit(limit)

    // Apply cursor filter and sort
    applyCursorSortAndFilter({
      query: q,
      cursor: params.cursor
    })

    const items: SavedViewGroup[] = await q

    // If first page and allowed, add the default/unsorted group
    if (!params.cursor && includeDefaultGroup) {
      const defaultGroup: SavedViewGroup = buildDefaultGroup({
        resourceIds,
        projectId
      })

      // Before we add the group, we need to potentially pop the last item
      // if the limit was reached
      if (items.length >= limit) {
        items.pop()
      }
      items.unshift(defaultGroup)
    }

    const newCursor = resolveNewCursor(items)

    return {
      items,
      cursor: newCursor
    }
  }

const getGroupSavedViewsBaseQueryFactory =
  (deps: { db: Knex }) => (params: GetGroupSavedViewsBaseParams) => {
    const { projectId, resourceIdString, groupId, search, userId } = params
    const onlyAuthored = params.onlyAuthored && userId

    const q = tables
      .savedViews(deps.db)
      .where({ [SavedViews.col.projectId]: projectId })

    const resourceIds = cleanLookupResourceIdString(resourceIdString)
    if (groupId) {
      q.where({ [SavedViews.col.groupId]: groupId })
    } else if (resourceIds.length) {
      // If no groupId, filter by resourceIds
      q.whereRaw('?? && ?', [SavedViews.col.resourceIds, resourceIds])
    } else {
      // Make query exit early - no resources
      q.whereRaw('false')
    }

    if (onlyAuthored) {
      q.where({ [SavedViews.col.authorId]: userId })
    } else {
      q.andWhere((w1) => {
        w1.andWhere(SavedViews.col.visibility, SavedViewVisibility.public)
        if (userId) {
          w1.orWhere(SavedViews.col.authorId, userId)
        }
      })
    }

    if (search) {
      q.where(SavedViews.col.name, 'ilike', `%${search}%`)
    }

    return q
  }

export const getGroupSavedViewsTotalCountFactory =
  (deps: { db: Knex }): GetGroupSavedViewsTotalCount =>
  async (params) => {
    const q = getGroupSavedViewsBaseQueryFactory(deps)(params)
    const countQ = deps.db.count<{ count: string }[]>().from(q.as('sq1'))
    const [count] = await countQ
    return parseInt(count.count + '')
  }

export const getGroupSavedViewsPageItemsFactory =
  (deps: { db: Knex }): GetGroupSavedViewsPageItems =>
  async (params) => {
    const sortByCol = params.sortBy || 'name'
    const sortDir = params.sortDirection || 'asc'

    const q = getGroupSavedViewsBaseQueryFactory(deps)(params)
    const { applyCursorSortAndFilter, resolveNewCursor } = compositeCursorTools({
      schema: SavedViews,
      cols: [sortByCol, 'id']
    })

    const limit = clamp(params.limit ?? 10, 0, 100)
    q.limit(limit)

    // Apply cursor filter and sort
    applyCursorSortAndFilter({ query: q, cursor: params.cursor, sort: sortDir })

    const items = await q
    const newCursor = resolveNewCursor(items)

    return {
      items,
      cursor: newCursor
    }
  }

export const getSavedViewGroupFactory =
  (deps: { db: Knex }): GetSavedViewGroup =>
  async ({ id, projectId }) => {
    // Check if default group ID
    const defaultGroupMetadata = decodeDefaultGroupId(id)
    if (defaultGroupMetadata) {
      if (projectId && defaultGroupMetadata.projectId !== projectId) {
        return undefined
      }

      return buildDefaultGroup({
        resourceIds: defaultGroupMetadata.resourceIds,
        projectId: defaultGroupMetadata.projectId
      })
    }

    const q = tables.savedViewGroups(deps.db).where({
      [SavedViewGroups.col.id]: id
    })

    if (projectId) {
      q.andWhere({ [SavedViewGroups.col.projectId]: projectId })
    }

    const group = await q.first()
    return group
  }

export const recalculateGroupResourceIdsFactory =
  (deps: { db: Knex }): RecalculateGroupResourceIds =>
  async ({ groupId }) => {
    const RawSavedViews = SavedViews.with({ quoted: true, withCustomTablePrefix: 'v' })
    const RawSavedViewGroups = SavedViewGroups.with({ quoted: true })

    const q = tables
      .savedViewGroups(deps.db)
      .where({ [SavedViewGroups.col.id]: groupId })
      .update(
        {
          // Recalculate the groups resourceIds based on the views in the group
          [SavedViewGroups.withoutTablePrefix.col.resourceIds]: deps.db.raw(
            `(
            SELECT ARRAY(
              SELECT DISTINCT unnest
              FROM ${RawSavedViews.name},
                  unnest(${RawSavedViews.col.resourceIds}) AS unnest
              WHERE ${RawSavedViews.col.groupId} = ${RawSavedViewGroups.col.id}
            )
           )`
          )
        },
        '*'
      )

    const results = await q
    return results.at(0)
  }
