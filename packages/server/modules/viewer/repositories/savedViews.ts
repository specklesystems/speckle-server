import { Branches, buildTableHelper } from '@/modules/core/dbSchema'
import type { Model } from '@/modules/core/domain/branches/types'
import {
  compositeCursorTools,
  formatJsonArrayRecords
} from '@/modules/shared/helpers/dbHelper'
import type {
  GetGroupSavedViewsBaseParams,
  GetGroupSavedViewsPageItems,
  GetGroupSavedViewsTotalCount,
  GetProjectSavedViewGroupsBaseParams,
  GetProjectSavedViewGroupsPageItems,
  GetProjectSavedViewGroupsTotalCount,
  GetSavedViewGroups,
  GetSavedViewGroup,
  GetStoredViewCount,
  GetUngroupedSavedViewsGroup,
  RecalculateGroupResourceIds,
  StoreSavedView,
  StoreSavedViewGroup,
  GetSavedViews,
  DeleteSavedViewRecord,
  UpdateSavedViewRecord,
  GetSavedView,
  GetStoredViewGroupCount,
  DeleteSavedViewGroupRecord,
  UpdateSavedViewGroupRecord,
  GetModelHomeSavedViews,
  GetModelHomeSavedView,
  SetNewHomeView
} from '@/modules/viewer/domain/operations/savedViews'
import {
  SavedViewVisibility,
  type SavedView,
  type SavedViewGroup
} from '@/modules/viewer/domain/types/savedViews'
import type { DefaultGroupMetadata } from '@/modules/viewer/helpers/savedViews'
import {
  buildDefaultGroupId,
  decodeDefaultGroupId,
  formatResourceIdsForGroup
} from '@/modules/viewer/helpers/savedViews'
import {
  isUngroupedGroup,
  ungroupedScenesGroupTitle
} from '@speckle/shared/saved-views'
import { resourceBuilder } from '@speckle/shared/viewer/route'
import cryptoRandomString from 'crypto-random-string'
import dayjs from 'dayjs'
import { type Knex } from 'knex'
import { clamp, isUndefined } from 'lodash-es'

const SavedViews = buildTableHelper('saved_views', [
  'id',
  'name',
  'description',
  'projectId',
  'authorId',
  'groupId',
  'resourceIds',
  'groupResourceIds',
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
  savedViewGroups: (db: Knex) => db<SavedViewGroup>(SavedViewGroups.name),
  branches: (db: Knex) => db<Model>(Branches.name)
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

export const getStoredViewGroupCountFactory =
  (deps: { db: Knex }): GetStoredViewGroupCount =>
  async ({ projectId }) => {
    const [count] = await tables.savedViewGroups(deps.db).where({ projectId }).count()
    return parseInt(count.count + '')
  }

const getProjectSavedViewGroupsBaseQueryFactory =
  (deps: { db: Knex }) => async (params: GetProjectSavedViewGroupsBaseParams) => {
    const { projectId, resourceIdString, search, userId } = params
    const onlyAuthored = params.onlyAuthored && userId
    const isFiltering = search || onlyAuthored
    const resourceIds = formatResourceIdsForGroup(resourceIdString)

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
          isGroupQuery
            ? SavedViewGroups.col.resourceIds
            : SavedViews.col.groupResourceIds,
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

      // checking search on views and group names too
      if (search) {
        query.andWhere((w1) => {
          w1.andWhere(SavedViews.col.name, 'ilike', `%${search}%`)

          if (mode === 'group') {
            w1.orWhere(SavedViewGroups.col.name, 'ilike', `%${search}%`)
          }
        })
      }

      return query
    }

    const q = tables
      .savedViewGroups(deps.db)
      .select<SavedViewGroup[]>(SavedViewGroups.cols)

    if (isFiltering) {
      // left join cause we may want to find groups by name and they may not
      // have any views in them
      q.leftJoin(SavedViews.name, SavedViews.col.groupId, SavedViewGroups.col.id)
    }

    applyFilters(q, 'group')

    // Group by groupId
    q.groupBy(SavedViewGroups.col.id)

    /**
     * Check if default group should be shown
     */
    const ungroupedViewFound = await applyFilters(
      tables.savedViews(deps.db),
      'view'
    ).first()
    const ungroupedSearchString = search
      ? ungroupedScenesGroupTitle.toLowerCase().includes(search)
      : null

    const includeDefaultGroup = Boolean(ungroupedViewFound) || ungroupedSearchString

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
    const { applyCursorSortAndFilter, resolveNewCursor, decode } =
      savedGroupCursorUtils()

    const limit = clamp(params.limit ?? 10, 0, 100)
    q.limit(limit)

    // Adjust cursor, in case it points to non-existant default group
    let cursor = decode(params.cursor)
    if (cursor?.id && isUngroupedGroup(cursor.id)) {
      // Default appears first, so just unset the cursor to get the real first item
      cursor = null
    }

    // Apply cursor filter and sort
    applyCursorSortAndFilter({
      query: q,
      cursor
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
    const { projectId, groupResourceIdString, groupId, search, userId } = params
    const onlyAuthored = params.onlyAuthored && userId

    const q = tables
      .savedViews(deps.db)
      .where({ [SavedViews.col.projectId]: projectId })

    const groupResourceIds = formatResourceIdsForGroup(groupResourceIdString)

    if (!groupResourceIds.length && !groupId) {
      // If no resources and no groupId, exit early
      q.whereRaw('false')
    }

    // Set group filter
    if (!isUndefined(groupId)) {
      q.where({ [SavedViews.col.groupId]: groupId })
    }

    // If no groupId, filter by resourceIds
    if (groupResourceIds.length && !groupId) {
      q.whereRaw('?? && ?', [SavedViews.col.groupResourceIds, groupResourceIds])
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
    const sortByCol = params.sortBy || 'updatedAt'
    const sortDir = params.sortDirection || 'desc'

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

export const getUngroupedSavedViewsGroupFactory =
  (): GetUngroupedSavedViewsGroup =>
  ({ projectId, resourceIdString }) =>
    buildDefaultGroup({
      resourceIds: resourceBuilder()
        .addFromString(resourceIdString)
        .map((r) => r.toString()),
      projectId
    })

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
                  unnest(${RawSavedViews.col.groupResourceIds}) AS unnest
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

/**
 * Get saved groups by IDs. Can handle unpersisted ungrouped groups too.
 */
export const getSavedViewGroupsFactory =
  (deps: { db: Knex }): GetSavedViewGroups =>
  async ({ groupIds }) => {
    if (!groupIds.length) {
      return {}
    }

    const defaultGroupsMetadata: { [groupId: string]: DefaultGroupMetadata } = {}
    const persistedGroupIds: Array<{ groupId: string; projectId: string }> = []
    for (const { groupId, projectId } of groupIds) {
      const defaultGroupMetadata = decodeDefaultGroupId(groupId)
      if (defaultGroupMetadata) {
        if (defaultGroupMetadata.projectId === projectId) {
          defaultGroupsMetadata[groupId] = defaultGroupMetadata
        }
      } else {
        persistedGroupIds.push({ groupId, projectId })
      }
    }

    let persistedGroups: SavedViewGroup[] = []
    if (persistedGroupIds.length) {
      const q = tables.savedViewGroups(deps.db).whereIn(
        [SavedViewGroups.col.id, SavedViewGroups.col.projectId],
        persistedGroupIds.map((g) => [g.groupId, g.projectId])
      )
      persistedGroups = await q
    }

    const groupsMap: { [groupId: string]: SavedViewGroup | undefined } = {}
    for (const { groupId, projectId } of groupIds) {
      const defaultGroupMetadata = defaultGroupsMetadata[groupId]
      if (defaultGroupMetadata) {
        groupsMap[groupId] = buildDefaultGroup({
          resourceIds: defaultGroupMetadata.resourceIds,
          projectId: defaultGroupMetadata.projectId
        })
      } else {
        groupsMap[groupId] =
          persistedGroups.find((g) => g.id === groupId && g.projectId === projectId) ||
          undefined
      }
    }
    return groupsMap
  }

export const getSavedViewsFactory =
  (deps: { db: Knex }): GetSavedViews =>
  async ({ viewIds }) => {
    if (!viewIds.length) {
      return {}
    }

    const q = tables.savedViews(deps.db).whereIn(
      [SavedViews.col.id, SavedViews.col.projectId],
      viewIds.map((v) => [v.viewId, v.projectId])
    )

    const views = await q

    const viewsMap: { [viewId: string]: SavedView | undefined } = {}
    for (const view of views) {
      viewsMap[view.id] = view
    }
    return viewsMap
  }

export const getSavedViewFactory =
  (deps: { db: Knex }): GetSavedView =>
  async ({ id, projectId }) => {
    const getSavedViews = getSavedViewsFactory(deps)
    const savedViews = await getSavedViews({ viewIds: [{ viewId: id, projectId }] })
    return savedViews[id]
  }

export const deleteSavedViewRecordFactory =
  (deps: { db: Knex }): DeleteSavedViewRecord =>
  async (params) => {
    const { savedViewId } = params
    const q = tables.savedViews(deps.db).where({
      [SavedViews.col.id]: savedViewId
    })

    // Delete the saved view
    const result = await q.delete()

    // If no rows were deleted, return false
    if (result === 0) {
      return false
    }

    // Otherwise, return true
    return true
  }

export const updateSavedViewRecordFactory =
  (deps: { db: Knex }): UpdateSavedViewRecord =>
  async (params) => {
    const { id, projectId, update } = params

    // Update the saved view
    const [updatedView] = await tables
      .savedViews(deps.db)
      .where({
        [SavedViews.col.id]: id,
        [SavedViews.col.projectId]: projectId
      })
      .update(update, '*')

    return updatedView || undefined
  }

export const deleteSavedViewGroupRecordFactory =
  (deps: { db: Knex }): DeleteSavedViewGroupRecord =>
  async (params) => {
    const { groupId, projectId } = params
    const q = tables.savedViewGroups(deps.db).where({
      [SavedViewGroups.col.id]: groupId,
      [SavedViewGroups.col.projectId]: projectId
    })

    // Delete the saved view group
    const result = await q.delete()

    // If no rows were deleted, return false
    if (result === 0) {
      return false
    }

    // Otherwise, return true
    return true
  }

export const updateSavedViewGroupRecordFactory =
  (deps: { db: Knex }): UpdateSavedViewGroupRecord =>
  async (params) => {
    const { groupId, projectId, update } = params

    // Update the saved view group
    const [updatedGroup] = await tables
      .savedViewGroups(deps.db)
      .where({
        [SavedViewGroups.col.id]: groupId,
        [SavedViewGroups.col.projectId]: projectId
      })
      .update(update, '*')

    return updatedGroup
  }

export const getModelHomeSavedViewsFactory =
  (deps: { db: Knex }): GetModelHomeSavedViews =>
  async (params) => {
    const { requests } = params

    const q = tables
      .branches(deps.db)
      // there should really only be 1 group per 1 view, but the schema does technically
      // allow for multiple
      .select<Array<{ modelId: string; views: SavedView[] }>>([
        Branches.colAs('id', 'modelId'),
        SavedViews.groupArray('views')
      ])
      .whereIn(
        [Branches.col.id, Branches.col.streamId],
        requests.map((r) => [r.modelId, r.projectId])
      )
      .innerJoin(SavedViews.name, (j1) => {
        j1.on(
          deps.db.raw('?? && ARRAY[??]', [
            SavedViews.col.groupResourceIds,
            Branches.col.id
          ])
        )
          .andOnVal(SavedViews.col.isHomeView, true)
          .andOnVal(SavedViews.col.visibility, SavedViewVisibility.public) // public only
      })
      .groupBy('modelId')

    const modelViews = (await q).map(({ modelId, views }) => {
      const formattedViews = formatJsonArrayRecords(views)
      return {
        modelId,
        view: formattedViews.at(0)
      }
    })

    const viewsMap: { [modelId: string]: SavedView | undefined } = {}
    for (const { modelId, view } of modelViews) {
      viewsMap[modelId] = view
    }
    return viewsMap
  }

export const getModelHomeSavedViewFactory =
  (deps: { db: Knex }): GetModelHomeSavedView =>
  async (params) => {
    const { modelId, projectId } = params
    const ret = await getModelHomeSavedViewsFactory(deps)({
      requests: [
        {
          modelId,
          projectId
        }
      ]
    })
    const [view] = Object.values(ret)
    return view
  }

export const setNewHomeViewFactory =
  (deps: { db: Knex }): SetNewHomeView =>
  async (params) => {
    const { projectId, modelId, newHomeViewId } = params

    const q = tables
      .savedViews(deps.db)
      .where({
        [SavedViews.col.projectId]: projectId,
        [SavedViews.col.groupResourceIds]: [modelId]
      })
      .update({
        [SavedViews.short.col.isHomeView]: newHomeViewId
          ? deps.db.raw(
              `
          CASE WHEN ?? = ? THEN true ELSE false END
          `,
              [SavedViews.col.id, newHomeViewId]
            )
          : false
      })

    await q

    return true
  }
