import { useApolloClient, useSubscription } from '@vue/apollo-composable'
import { useLock } from '~/lib/common/composables/singleton'
import { graphql } from '~/lib/common/generated/gql'
import { ProjectSavedViewsUpdatedMessageType } from '~/lib/common/generated/gql/graphql'
import {
  onGroupViewRemovalCacheUpdates,
  onNewGroupViewCacheUpdates
} from '~/lib/viewer/helpers/savedViews/cache'

const onProjectSavedViewsUpdatedSubscription = graphql(`
  subscription OnProjectSavedViewsUpdated($projectId: ID!) {
    projectSavedViewsUpdated(projectId: $projectId) {
      type
      id
      savedView {
        id
        ...ViewerSavedViewsPanelView_SavedView
      }
      deletedSavedView {
        groupId
        resourceIds
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
      //   viewId: event.id,
      //   groupId: event.groupId || null,
      //   projectId: unref(projectId)
      // })
    } else if (
      event.type === ProjectSavedViewsUpdatedMessageType.Created &&
      event.savedView
    ) {
      // TODO: What if empty group of other person - shouldnt show up
      // const groupId = event.groupId || null
      // onNewGroupViewCacheUpdates(cache, {
      //   viewId: event.id,
      //   groupId,
      //   projectId: unref(projectId)
      // })
    }
  })
}
