import { ApolloCache } from '@apollo/client/cache'
import { JSONContent } from '@tiptap/core'
import { useApolloClient, useSubscription } from '@vue/apollo-composable'
import { MaybeRef } from '@vueuse/core'
import dayjs from 'dayjs'
import { Get } from 'type-fest'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import {
  CommentContentInput,
  CreateCommentReplyInput,
  OnViewerCommentsUpdatedSubscription
} from '~~/lib/common/generated/gql/graphql'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import {
  archiveCommentMutation,
  createCommentReplyMutation,
  createCommentThreadMutation,
  markCommentViewedMutation
} from '~~/lib/viewer/graphql/mutations'
import { onViewerCommentsUpdatedSubscription } from '~~/lib/viewer/graphql/subscriptions'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useCollectCommentData } from '~~/lib/viewer/composables/activity'
import type { Vector3 } from 'three'
import { Nullable, RichTextEditor } from '@speckle/shared'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { SuccessfullyUploadedFileItem } from '~~/lib/core/api/blobStorage'

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

  return async (projectId: string, threadId: string) => {
    if (!isLoggedIn.value) return false
    const { data, errors } = await apollo
      .mutate({
        mutation: markCommentViewedMutation,
        variables: {
          projectId,
          threadId
        },
        update: (cache, { data }) => {
          if (!data?.commentMutations.markViewed) return

          cache.modify({
            id: getCacheId('Comment', threadId),
            fields: {
              viewedAt: () => dayjs().toISOString()
            }
          })
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (errors) {
      console.error('Marking thread as viewed failed', errors)
    }

    return !!data?.commentMutations.markViewed
  }
}

export type CommentEditorValue = {
  doc?: JSONContent | null
  attachments?: SuccessfullyUploadedFileItem[] | null
}

export function useSubmitComment() {
  const {
    projectId,
    resources: {
      request: { resourceIdString }
    },
    viewer: { instance: viewerInstance }
  } = useInjectedViewerState()
  const { isLoggedIn } = useActiveUser()
  const client = useApolloClient().client
  const collectViewerData = useCollectCommentData()
  const { triggerNotification } = useGlobalToast()

  return async (
    content: CommentContentInput,
    selectionLocation?: Nullable<Vector3>
  ) => {
    if (!isLoggedIn.value) return null

    const isEmpty = RichTextEditor.isDocEmpty(content.doc)
    if (isEmpty) return null

    const viewerData = collectViewerData()
    if (selectionLocation) {
      viewerData.location = selectionLocation
    }
    const screenshot = await viewerInstance.screenshot()

    const { data, errors } = await client
      .mutate({
        mutation: createCommentThreadMutation,
        variables: {
          input: {
            projectId: projectId.value,
            resourceIdString: resourceIdString.value,
            content,
            viewerData,
            screenshot
          }
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (data?.commentMutations.create) {
      return data.commentMutations.create
    }

    const errMsg = getFirstErrorMessage(errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Comment creation failed',
      description: errMsg
    })

    return null
  }
}

export function useSubmitReply() {
  const { isLoggedIn } = useActiveUser()
  const client = useApolloClient().client
  const { triggerNotification } = useGlobalToast()

  return async (input: CreateCommentReplyInput) => {
    if (!isLoggedIn.value) return null

    const isEmpty = RichTextEditor.isDocEmpty(input.content.doc)
    if (isEmpty) return null

    const { data, errors } = await client
      .mutate({
        mutation: createCommentReplyMutation,
        variables: {
          input
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (data?.commentMutations.reply) {
      return data.commentMutations.reply
    }

    const errMsg = getFirstErrorMessage(errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Reply creation failed',
      description: errMsg
    })

    return null
  }
}

export function useArchiveComment() {
  const { isLoggedIn } = useActiveUser()
  const client = useApolloClient().client
  const { triggerNotification } = useGlobalToast()

  return async (commentId: string) => {
    if (!isLoggedIn.value || !commentId) return false

    const { data, errors } = await client
      .mutate({
        mutation: archiveCommentMutation,
        variables: {
          commentId
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (data?.commentMutations.archive) return true

    const errMsg = getFirstErrorMessage(errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Comment archival failed',
      description: errMsg
    })

    return false
  }
}
