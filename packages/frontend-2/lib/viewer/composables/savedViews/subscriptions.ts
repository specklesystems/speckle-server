import { isUngroupedGroup } from '@speckle/shared/saved-views'
import { useApolloClient, useSubscription } from '@vue/apollo-composable'
import { useLock } from '~/lib/common/composables/singleton'
import { graphql } from '~/lib/common/generated/gql'
import {
  ProjectSavedViewsUpdatedMessageType,
  SortDirection
} from '~/lib/common/generated/gql/graphql'
import {
  getCachedObjectKeys,
  type CacheObjectReference
} from '~/lib/common/helpers/graphql'
import {
  filterKeys,
  onGroupViewRemovalCacheUpdates,
  onNewGroupViewCacheUpdates
} from '~/lib/viewer/helpers/savedViews/cache'

/**
 * For group updates: TODO:
 * - On new ungroup view (first one), new group is added to end
 *
 * TEST:
 * - W/ tab2 views panel closed (empty cache)
 * - W/ federated views/groups
 * - W/ multiple ungrouped groups/views
 */

const onProjectSavedViewsUpdatedSubscription = graphql(`
  subscription OnProjectSavedViewsUpdated($projectId: ID!) {
    projectSavedViewsUpdated(projectId: $projectId) {
      type
      id
      savedView {
        id
        resourceIds
        group {
          id
          groupId
          resourceIds
        }
        ...ViewerSavedViewsPanelView_SavedView
      }
      beforeChangeSavedView {
        groupId
        resourceIds
        groupResourceIds
        position
      }
    }
  }
`)

export const useOnProjectSavedViewsUpdated = (params: {
  projectId: MaybeRef<string>
}) => {
  const { projectId } = params

  const { userId } = useActiveUser()
  const { triggerNotification } = useGlobalToast()
  const apollo = useApolloClient().client
  const { hasLock } = useLock(
    computed(() => `useOnProjectSavedViewsUpdated-${unref(projectId)}`)
  )
  const isEnabled = computed(() => hasLock.value)
  const { onResult: onViewsUpdated } = useSubscription(
    onProjectSavedViewsUpdatedSubscription,
    () => ({
      projectId: unref(projectId)
    }),
    () => ({ enabled: !!(isEnabled.value && userId.value) })
  )

  onViewsUpdated((res) => {
    if (!res.data?.projectSavedViewsUpdated || !hasLock.value) return

    const event = res.data.projectSavedViewsUpdated
    const cache = apollo.cache
    const beforeChangeView = event.beforeChangeSavedView

    if (
      event.type === ProjectSavedViewsUpdatedMessageType.Deleted &&
      beforeChangeView
    ) {
      onGroupViewRemovalCacheUpdates({
        cache,
        viewId: event.id,
        projectId: unref(projectId),
        ...(beforeChangeView.groupId
          ? {
              group: {
                id: beforeChangeView.groupId,
                resourceIds: beforeChangeView.groupResourceIds
              }
            }
          : {
              view: {
                resourceIds: beforeChangeView.resourceIds
              }
            })
      })

      cache.evict({
        id: getCacheId('SavedView', event.id)
      })
    } else if (
      event.type === ProjectSavedViewsUpdatedMessageType.Created &&
      event.savedView
    ) {
      onNewGroupViewCacheUpdates({
        cache,
        viewId: event.id,
        projectId: unref(projectId),
        ...(event.savedView.group.groupId
          ? {
              group: {
                id: event.savedView.group.groupId,
                resourceIds: event.savedView.group.resourceIds
              }
            }
          : {
              view: {
                resourceIds: event.savedView.resourceIds
              }
            })
      })

      triggerNotification({
        title: 'New view created',
        type: ToastNotificationType.Success
      })
    } else if (
      event.type === ProjectSavedViewsUpdatedMessageType.Updated &&
      event.savedView &&
      event.beforeChangeSavedView
    ) {
      const oldGroupId = event.beforeChangeSavedView.groupId
      const newGroupId = event.savedView.group.groupId
      const groupChanged = oldGroupId !== newGroupId
      const positionChanged =
        groupChanged ||
        event.beforeChangeSavedView.position !== event.savedView.position

      if (groupChanged) {
        // Remove from old group, add to new one
        onGroupViewRemovalCacheUpdates({
          cache,
          viewId: event.savedView.id,
          projectId: event.savedView.projectId,
          ...(oldGroupId
            ? {
                group: {
                  id: oldGroupId,
                  resourceIds: event.beforeChangeSavedView.groupResourceIds
                }
              }
            : {
                view: {
                  resourceIds: event.beforeChangeSavedView.resourceIds
                }
              })
        })

        onNewGroupViewCacheUpdates({
          cache,
          viewId: event.savedView.id,
          projectId: event.savedView.projectId,
          ...(newGroupId
            ? {
                group: {
                  id: newGroupId,
                  resourceIds: event.savedView.group.resourceIds
                }
              }
            : {
                view: {
                  resourceIds: event.savedView.resourceIds
                }
              })
        })
      }

      // If set to home view, clear home view on all other views related to the same resourceIdString
      if (event.savedView.isHomeView && event.savedView.groupResourceIds.length === 1) {
        const allSavedViewKeys = getCachedObjectKeys(cache, 'SavedView')
        const modelId = event.savedView.groupResourceIds[0]

        for (const savedViewKey of allSavedViewKeys) {
          modifyObjectField(
            cache,
            savedViewKey,
            'isHomeView',
            ({ value: isHomeView, helpers: { readObject } }) => {
              const view = readObject()
              const groupIds = view.groupResourceIds
              const viewId = view.id
              const projectId = view.projectId
              if (viewId === event.savedView!.id) return
              if (event.savedView!.projectId !== projectId) return

              if (isHomeView && groupIds?.length === 1 && groupIds[0] === modelId) {
                return false
              }
            }
          )
        }
      }

      // If position changed, recalculate it according to sort dir in vars
      if (positionChanged) {
        // Go through all SavedViewGroup.views, where this view exists and update array position
        iterateObjectField(
          cache,
          getCacheId('Project', unref(projectId)),
          'savedViewGroups',
          ({ value, helpers: { fromRef } }) => {
            const items = value.items
            if (!items) return

            items.forEach((groupRef) => {
              const parsed = fromRef(groupRef)
              modifyObjectField(
                cache,
                getCacheId('SavedViewGroup', parsed.id),
                'views',
                ({ helpers: { createUpdatedValue, readField }, variables }) => {
                  const sortDir = variables.input.sortDirection || SortDirection.Desc
                  const sortBy = (variables.input.sortBy || 'position') as
                    | 'position'
                    | 'updatedAt'

                  return createUpdatedValue(({ update }) => {
                    update('items', (items) => {
                      const newItems = items.slice().sort((a, b) => {
                        const process = (ref: CacheObjectReference<'SavedView'>) => {
                          const val = readField(ref, sortBy)
                          if (!val) return -1

                          if (sortBy === 'updatedAt') {
                            return new Date(val).getTime()
                          }
                          return val as number
                        }

                        const aVal = process(a)
                        const bVal = process(b)

                        if (aVal < bVal) return sortDir === SortDirection.Asc ? -1 : 1
                        if (aVal > bVal) return sortDir === SortDirection.Asc ? 1 : -1
                        return 0
                      })
                      return newItems
                    })
                  })
                }
              )
            })
          }
        )
      }
    }
  })
}

const onProjectSavedViewGroupsUpdatedSubscription = graphql(`
  subscription OnProjectSavedViewGroupsUpdated($projectId: ID!) {
    projectSavedViewGroupsUpdated(projectId: $projectId) {
      type
      id
      savedViewGroup {
        id
        projectId
        author {
          id
        }
      }
    }
  }
`)

export const useOnProjectSavedViewGroupsUpdated = (params: {
  projectId: MaybeRef<string>
}) => {
  const { projectId } = params

  const { userId } = useActiveUser()
  const apollo = useApolloClient().client
  const { hasLock } = useLock(
    computed(() => `useOnProjectSavedViewGroupsUpdated-${unref(projectId)}`)
  )
  const isEnabled = computed(() => hasLock.value)
  const { onResult: onGroupsUpdated } = useSubscription(
    onProjectSavedViewGroupsUpdatedSubscription,
    () => ({
      projectId: unref(projectId)
    }),
    () => ({ enabled: !!(isEnabled.value && userId.value) })
  )

  onGroupsUpdated((res) => {
    if (!res.data?.projectSavedViewGroupsUpdated || !hasLock.value) return

    const event = res.data.projectSavedViewGroupsUpdated
    const { id } = event
    const cache = apollo.cache
    const group = event.savedViewGroup

    if (event.type === ProjectSavedViewsUpdatedMessageType.Deleted) {
      // Views can be moved around, just easier to evict Project.savedViewGroups
      modifyObjectField(
        cache,
        getCacheId('Project', unref(projectId)),
        'savedViewGroups',
        ({ helpers: { evict } }) => evict()
      )
      // Evict
      cache.evict({
        id: getCacheId('SavedViewGroup', id)
      })
    } else if (event.type === ProjectSavedViewsUpdatedMessageType.Created && group) {
      // Project.savedViewGroups +1, but only if owned OR not empty
      // (and its gonna be empty on create)
      const isOwner = group.author?.id === userId.value
      if (isOwner) {
        modifyObjectField(
          cache,
          getCacheId('Project', group.projectId),
          'savedViewGroups',
          ({ helpers: { createUpdatedValue, fromRef, ref } }) =>
            createUpdatedValue(({ update }) => {
              update('totalCount', (totalCount) => totalCount + 1)
              update('items', (items) => {
                const newItems = items.slice()

                // default comes first, then new group
                const defaultIdx = newItems.findIndex((i) =>
                  isUngroupedGroup(fromRef(i).id)
                )

                newItems.splice(defaultIdx + 1, 0, ref('SavedViewGroup', group.id))

                return newItems
              })
            }),
          { autoEvictFiltered: filterKeys }
        )
      }
    } else if (event.type === ProjectSavedViewsUpdatedMessageType.Updated) {
      // Nothing to do here for now - fields are updated automatically in cache
    }
  })
}

export const useProjectSavedViewsUpdateTracking = (params: {
  projectId: MaybeRef<string>
}) => {
  useOnProjectSavedViewsUpdated(params)
  useOnProjectSavedViewGroupsUpdated(params)
}
