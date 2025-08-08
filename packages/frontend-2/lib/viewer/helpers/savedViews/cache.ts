import type { ApolloCache } from '@apollo/client/cache'

/**
 * Cache mutations for when a group gets a new view:
 * - If new group, Project.savedViewGroups + 1
 * - SavedViewGroup.views + 1
 */
export const onNewGroupViewCacheUpdates = (
  cache: ApolloCache<unknown>,
  params: {
    /**
     * The ID of the view being added
     */
    viewId: string
    /**
     * The ID of the group the view is being added to
     */
    groupId: string
    projectId: string
  }
) => {
  const { viewId, groupId, projectId } = params

  // Project.savedViewGroups + 1, if it is a new group
  modifyObjectField(
    cache,
    getCacheId('Project', projectId),
    'savedViewGroups',
    ({ helpers: { createUpdatedValue, ref, fromRef }, value }) => {
      const isNewGroup = !value?.items?.some((group) => fromRef(group).id === groupId)
      if (!isNewGroup) return

      return createUpdatedValue(({ update }) => {
        update('totalCount', (count) => count + 1)
        update('items', (items) => [...items, ref('SavedViewGroup', groupId)])
      })
    },
    { autoEvictFiltered: true }
  )

  // SavedViewGroup.views + 1
  modifyObjectField(
    cache,
    getCacheId('SavedViewGroup', groupId),
    'views',
    ({ helpers: { createUpdatedValue, ref } }) => {
      return createUpdatedValue(({ update }) => {
        update('totalCount', (count) => count + 1)
        update('items', (items) => [ref('SavedView', viewId), ...items])
      })
    },
    { autoEvictFiltered: true }
  )
}

/**
 * Cache mutations for when a view is removed from a group:
 * - If default group and it is now empty, remove it entirely - evict and remove from Project.savedViewGroups
 * - Otherwise just: SavedViewGroup.views - 1
 */
export const onGroupViewRemovalCacheUpdates = (
  cache: ApolloCache<unknown>,
  params: {
    /**
     * The ID of the view being removed
     */
    viewId: string
    /**
     * The ID of the group the view is being removed from
     */
    groupId: string
    projectId: string
  }
) => {
  const { viewId: id, groupId, projectId } = params

  // Check if default/ungrouped group
  const isDefaultGroup = groupId.startsWith('default-')

  // If default group and its now empty - remove it as it doesn't exist otherwise
  let shouldEvict
  if (isDefaultGroup) {
    let viewsRemain = false
    iterateObjectField(
      cache,
      getCacheId('SavedViewGroup', groupId),
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
      { autoEvictFiltered: true }
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
      { autoEvictFiltered: true }
    )
  }
}
