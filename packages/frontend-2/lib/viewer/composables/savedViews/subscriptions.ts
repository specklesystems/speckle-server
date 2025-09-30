import { useApolloClient, useSubscription } from '@vue/apollo-composable'
import { useLock } from '~/lib/common/composables/singleton'
import { graphql } from '~/lib/common/generated/gql'
import { ProjectSavedViewsUpdatedMessageType } from '~/lib/common/generated/gql/graphql'
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
    }
  }
`)

export const useOnProjectSavedViewsUpdated = (params: {
  projectId: MaybeRef<string>
}) => {
  const { projectId } = params

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
    }
  })
}
