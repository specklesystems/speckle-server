import { ApolloCache } from '@apollo/client/cache'
import { JSONContent } from '@tiptap/core'
import { useApolloClient, useSubscription } from '@vue/apollo-composable'
import { MaybeRef } from '@vueuse/core'
import dayjs from 'dayjs'
import { Get } from 'type-fest'
import { MaybeNullOrUndefined } from '@speckle/shared'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { OnViewerCommentsUpdatedSubscription } from '~~/lib/common/generated/gql/graphql'
import { convertThrowIntoFetchResult, getCacheId } from '~~/lib/common/helpers/graphql'
import { markCommentViewedMutation } from '~~/lib/viewer/graphql/mutations'
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

export function useMarkThreadViewed() {
  const apollo = useApolloClient().client
  const { isLoggedIn } = useActiveUser()

  return {
    markThreadViewed: async (projectId: string, threadId: string) => {
      if (!isLoggedIn.value) return false
      const { data } = await apollo
        .mutate({
          mutation: markCommentViewedMutation,
          variables: {
            projectId,
            threadId
          },
          update: (cache, { data }) => {
            if (!data?.commentView) return

            cache.modify({
              id: getCacheId('Comment', threadId),
              fields: {
                viewedAt: () => dayjs().toISOString()
              }
            })
          }
        })
        .catch(convertThrowIntoFetchResult)

      return !!data?.commentView
    }
  }
}

export type CommentSubmissionData = {
  doc: MaybeNullOrUndefined<JSONContent>
  /**
   * TODO:
   */
  attachments?: never[]
}

// TODO:
export function useSubmitComment() {
  return {}
}
