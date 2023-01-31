import { ApolloCache } from '@apollo/client/cache'
import { useApolloClient, useSubscription } from '@vue/apollo-composable'
import { MaybeRef } from '@vueuse/core'
import { Get } from 'type-fest'
import { OnViewerCommentsUpdatedSubscription } from '~~/lib/common/generated/gql/graphql'
import { onViewerCommentsUpdatedSubscription } from '~~/lib/viewer/graphql/subscriptions'

export function useViewerCommentUpdateTracking(
  projectId: MaybeRef<string>,
  resourceIdString: MaybeRef<string>,
  handler?: (
    data: NonNullable<
      Get<OnViewerCommentsUpdatedSubscription, 'projectCommentsUpdated'>
    >,
    cache: ApolloCache<unknown>
  ) => void
) {
  const apollo = useApolloClient().client
  const { onResult: onViewerCommentUpdated } = useSubscription(
    onViewerCommentsUpdatedSubscription,
    () => ({
      projectId: unref(projectId),
      resourceIdString: unref(resourceIdString)
    })
  )

  onViewerCommentUpdated((res) => {
    if (!res.data?.projectCommentsUpdated) return

    const event = res.data.projectCommentsUpdated
    const cache = apollo.cache

    handler?.(event, cache)
  })
}
