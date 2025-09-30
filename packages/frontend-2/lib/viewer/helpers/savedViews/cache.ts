import type { ApolloCache } from '@apollo/client/cache'
import {
  decodeDefaultGroupId,
  formatResourceIdsForGroup,
  isUngroupedGroup
} from '@speckle/shared/saved-views'
import { intersection } from 'lodash-es'
import {
  getCachedObjectKeys,
  getCacheKey,
  parseObjectKey,
  type ApolloCacheObjectKey
} from '~/lib/common/helpers/graphql'

export const filterKeys = [
  'input.search',
  'input.onlyAuthored',
  'input.onlyVisibility',
  'filter.search',
  'filter.onlyAuthored',
  'filter.onlyVisibility'
]

type GroupIdOrViewInfo =
  | {
      group: {
        id: string
        resourceIds: string[]
      }
    }
  | {
      view: {
        resourceIds: string[]
      }
    }

/**
 * A real group will only have 1 id, but for a null (ungrouped) group we need extra metadata from the view
 * to find out relevant ones, which may be multiple
 */
const resolveCacheGroupKeys = (
  params: {
    cache: ApolloCache<unknown>
    projectId: string
  } & GroupIdOrViewInfo
): Array<{
  key: ApolloCacheObjectKey<'SavedViewGroup'>
  id: string
  metadata: {
    resourceIds: string[]
  }
  isUngrouped: boolean
}> => {
  const { cache, projectId } = params
  if ('group' in params) {
    const group = params.group
    if (isUngroupedGroup(group.id)) {
      throw new Error('Ungrouped/default group ids are not allowed')
    }
    return [
      {
        key: getCacheKey('SavedViewGroup', group.id),
        id: group.id,
        metadata: { resourceIds: group.resourceIds },
        isUngrouped: false
      }
    ]
  }

  const viewResourceIds = params.view.resourceIds
  const allGroupCacheKeys = getCachedObjectKeys(cache, 'SavedViewGroup')
  const ret: Array<{
    key: ApolloCacheObjectKey<'SavedViewGroup'>
    id: string
    metadata: {
      resourceIds: string[]
    }
    isUngrouped: boolean
  }> = []
  for (const groupKey of allGroupCacheKeys) {
    const { id } = parseObjectKey(groupKey)
    const defaultGroup = decodeDefaultGroupId(id)
    if (!defaultGroup) continue // not default group
    if (defaultGroup.projectId !== projectId) continue // not in this project

    // See if resourceIds match up
    const groupResourceIds = defaultGroup.resourceIds
    const viewGroupResourceIds = formatResourceIdsForGroup(viewResourceIds)
    const hasMatch = intersection(groupResourceIds, viewGroupResourceIds).length > 0
    if (hasMatch) {
      ret.push({ key: groupKey, metadata: defaultGroup, id, isUngrouped: true })
    }
  }

  return ret
}

/**
 * Cache mutations for when a group gets a new view:
 * - If new group, Project.savedViewGroups + 1
 * - SavedViewGroup.views + 1
 */
export const onNewGroupViewCacheUpdates = (
  params: {
    cache: ApolloCache<unknown>
    /**
     * The ID of the view being added
     */
    viewId: string
    projectId: string
  } & GroupIdOrViewInfo
) => {
  const { viewId, projectId, cache } = params
  const groupKeys = resolveCacheGroupKeys(params)

  // Project.savedViewGroups + 1, if it is a new group
  modifyObjectField(
    cache,
    getCacheId('Project', projectId),
    'savedViewGroups',
    ({ helpers: { createUpdatedValue, keyToRef, fromRef }, value, variables }) => {
      if (!value.items?.length) return // no groups query at all? skip

      /**
       * - 1. If group already in the list - skip
       * - 2. If not and vars.resourceIds match w/ new group resourceIds, then add
       */
      const existingGroupKeys = value.items!.map((i) => i.__ref)
      const hasUngroupedAlready = value.items.some((i) =>
        isUngroupedGroup(fromRef(i).id)
      )
      const groupsResourceIds = formatResourceIdsForGroup(
        variables.input.resourceIdString
      )

      const newGroupKeys = groupKeys
        .filter((k) => {
          if (k.isUngrouped && hasUngroupedAlready) return false // ungrouped already exists
          if (existingGroupKeys.includes(k.key)) return false // already exists
          const hasMatch =
            intersection(groupsResourceIds, k.metadata.resourceIds).length > 0
          if (!hasMatch) return false // resourceIds don't match

          return true
        })
        .map((g) => g.key)
      if (!newGroupKeys.length) return

      const newUngrouped = newGroupKeys.filter((k) =>
        isUngroupedGroup(parseObjectKey(k).id)
      )
      const newGrouped = newGroupKeys.filter(
        (k) => !isUngroupedGroup(parseObjectKey(k).id)
      )
      const extraCount = newGroupKeys.length

      return createUpdatedValue(({ update }) => {
        update('totalCount', (count) => count + extraCount)
        update('items', (items) => [
          ...newGrouped.map((k) => keyToRef(k)),
          ...items,
          ...newUngrouped.map((k) => keyToRef(k))
        ])
      })
    },
    { autoEvictFiltered: filterKeys }
  )

  for (const { key: groupKey } of groupKeys) {
    // SavedViewGroup.views + 1
    modifyObjectField(
      cache,
      groupKey,
      'views',
      ({ helpers: { createUpdatedValue, ref, readField }, value }) => {
        const hasItemAlready = value.items?.some(
          (item) => readField(item, 'id') === viewId
        )
        if (hasItemAlready) return

        return createUpdatedValue(({ update }) => {
          update('totalCount', (count) => count + 1)
          update('items', (items) => [ref('SavedView', viewId), ...items])
        })
      },
      { autoEvictFiltered: filterKeys }
    )
  }
}

/**
 * Cache mutations for when a view is removed from a group:
 * - If default group and it is now empty, remove it entirely - evict and remove from Project.savedViewGroups
 * - Otherwise just: SavedViewGroup.views - 1
 */
export const onGroupViewRemovalCacheUpdates = (
  params: {
    cache: ApolloCache<unknown>
    /**
     * The ID of the view being removed
     */
    viewId: string
    projectId: string
  } & GroupIdOrViewInfo
) => {
  const { viewId: id, projectId, cache } = params
  const groupKeys = resolveCacheGroupKeys(params)

  for (const { key: groupKey, id: groupId, isUngrouped } of groupKeys) {
    // Check if default/ungrouped group
    const isDefaultGroup = isUngrouped

    // If default group and its now empty - remove it as it doesn't exist otherwise
    let shouldEvict
    if (isDefaultGroup) {
      let viewsRemain = false
      iterateObjectField(
        cache,
        groupKey,
        'views',
        ({ value, helpers: { fromRef } }) => {
          const otherItems = value?.items?.filter((item) => fromRef(item).id !== id)

          if (otherItems?.length) {
            viewsRemain = true
          }
        }
      )

      if (!viewsRemain) {
        shouldEvict = true
      }
    }

    // Remove default group, if its empty
    if (shouldEvict) {
      // Project.savedViewGroups - 1
      modifyObjectField(
        cache,
        getCacheId('Project', projectId),
        'savedViewGroups',
        ({ helpers: { createUpdatedValue, fromRef } }) => {
          return createUpdatedValue(({ update }) => {
            update('totalCount', (count) => count - 1)
            update('items', (items) =>
              items.filter((item) => fromRef(item).id !== groupId)
            )
          })
        },
        { autoEvictFiltered: filterKeys }
      )

      // Evict entirely
      cache.evict({ id: getCacheId('SavedViewGroup', groupId) })
    } else {
      // Remove view from view lists (in groups)
      // SavedViewGroup.views - 1
      modifyObjectField(
        cache,
        getCacheId('SavedViewGroup', groupId),
        'views',
        ({ helpers: { createUpdatedValue, fromRef } }) => {
          return createUpdatedValue(({ update }) => {
            update('totalCount', (count) => count - 1)
            update('items', (items) => items.filter((item) => fromRef(item).id !== id))
          })
        },
        { autoEvictFiltered: filterKeys }
      )
    }
  }
}
