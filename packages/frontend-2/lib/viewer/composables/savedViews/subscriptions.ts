import { useApolloClient, useSubscription } from '@vue/apollo-composable'
import { useLock } from '~/lib/common/composables/singleton'
import { graphql } from '~/lib/common/generated/gql'
import { ProjectSavedViewsUpdatedMessageType } from '~/lib/common/generated/gql/graphql'
import { onNewGroupViewCacheUpdates } from '~/lib/viewer/helpers/savedViews/cache'

const onProjectSavedViewsUpdatedSubscription = graphql(`
  subscription OnProjectSavedViewsUpdated($projectId: ID!) {
    projectSavedViewsUpdated(projectId: $projectId) {
      type
      id
      savedView {
        id
        group {
          id
        }
        ...ViewerSavedViewsPanelView_SavedView
      }
    }
  }
`)

const useOnProjectSavedViewsUpdated = (params: { projectId: MaybeRef<string> }) => {
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

    if (event.type === ProjectSavedViewsUpdatedMessageType.Deleted) {
      cache.evict({
        id: getCacheId('SavedView', event.id)
      })

      // onGroupViewRemovalCacheUpdates(cache, {
      //   viewId: id,
      //   groupId,
      //   projectId
      // })
    } else if (
      event.type === ProjectSavedViewsUpdatedMessageType.Created &&
      event.savedView
    ) {
      const groupId = event.savedView.group.id
      onNewGroupViewCacheUpdates(cache, {
        viewId: event.id,
        groupId,
        projectId: unref(projectId)
      })
    }
  })
}
