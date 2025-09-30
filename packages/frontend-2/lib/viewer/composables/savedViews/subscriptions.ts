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
  onGroupViewRemovalCacheUpdates,
  onNewGroupViewCacheUpdates
} from '~/lib/viewer/helpers/savedViews/cache'

/**
 * For group updates: TODO:
 * - What if empty group of other person - shouldnt show up
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
      deletedSavedView {
        groupId
        resourceIds
        groupResourceIds
      }
      update {
        positionUpdated
      }
    }
  }
`)

export const useOnProjectSavedViewsUpdated = (params: {
  projectId: MaybeRef<string>
}) => {
  const { projectId } = params

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
    { enabled: isEnabled }
  )

  onViewsUpdated((res) => {
    if (!res.data?.projectSavedViewsUpdated || !hasLock.value) return

    const event = res.data.projectSavedViewsUpdated
    const cache = apollo.cache
    const deletedView = event.deletedSavedView

    if (event.type === ProjectSavedViewsUpdatedMessageType.Deleted && deletedView) {
      onGroupViewRemovalCacheUpdates({
        cache,
        viewId: event.id,
        projectId: unref(projectId),
        ...(deletedView.groupId
          ? {
              group: {
                id: deletedView.groupId,
                resourceIds: deletedView.groupResourceIds
              }
            }
          : {
              view: {
                resourceIds: deletedView.resourceIds
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
      event.savedView
    ) {
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
      if (event.update.positionUpdated) {
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
