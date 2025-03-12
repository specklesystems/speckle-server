import type { ApolloCache } from '@apollo/client/cache'
import type { JSONContent } from '@tiptap/core'
import { useApolloClient, useSubscription } from '@vue/apollo-composable'
import type { MaybeRef } from '@vueuse/core'
import dayjs from 'dayjs'
import type { Get } from 'type-fest'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import type {
  ArchiveCommentInput,
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
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import type { SuccessfullyUploadedFileItem } from '~~/lib/core/api/blobStorage'
import { isValidCommentContentInput } from '~~/lib/viewer/helpers/comments'
import { useStateSerialization } from '~~/lib/viewer/composables/serialization'
import type { CommentBubbleModel } from '~/lib/viewer/composables/commentBubbles'
import { modelRoute } from '~~/lib/common/helpers/route'
import { useRouter, useRoute } from 'vue-router'
import { useCameraUtilities } from '~/lib/viewer/composables/ui'

export function useViewerCommentUpdateTracking(
  params: {
    projectId: MaybeRef<string>
    resourceIdString: MaybeRef<string>
    loadedVersionsOnly?: MaybeRef<MaybeNullOrUndefined<boolean>>
  },
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
      target: {
        projectId: unref(params.projectId),
        resourceIdString: unref(params.resourceIdString),
        loadedVersionsOnly: unref(params.loadedVersionsOnly)
      }
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
  const logger = useLogger()

  return async (projectId: string, threadId: string) => {
    if (!isLoggedIn.value) return false
    const { data, errors } = await apollo
      .mutate({
        mutation: markCommentViewedMutation,
        variables: {
          input: {
            projectId,
            commentId: threadId
          }
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
      logger.error('Marking thread as viewed failed', errors)
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
  const { triggerNotification } = useGlobalToast()
  const { serialize } = useStateSerialization()

  return async (content: CommentContentInput) => {
    if (!isLoggedIn.value) return null
    if (!isValidCommentContentInput(content)) return null
    const screenshot = await viewerInstance.screenshot()

    const { data, errors } = await client
      .mutate({
        mutation: createCommentThreadMutation,
        variables: {
          input: {
            projectId: projectId.value,
            resourceIdString: resourceIdString.value,
            content,
            viewerState: serialize({ concreteResourceIdString: true }),
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
    if (!isValidCommentContentInput(input.content)) return null

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

  return async (input: ArchiveCommentInput) => {
    const { commentId, projectId } = input

    if (!isLoggedIn.value || !commentId || !projectId) return false

    const { data, errors } = await client
      .mutate({
        mutation: archiveCommentMutation,
        variables: {
          input
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

export function useCheckViewerCommentingAccess() {
  const {
    resources: {
      response: { project }
    }
  } = useInjectedViewerState()
  const { activeUser } = useActiveUser()

  return computed(() => {
    if (!activeUser.value) return false

    const hasRole = !!project.value?.role
    const allowPublicComments = !!project.value?.allowPublicComments

    return hasRole || allowPublicComments
  })
}

export function useCommentModelContext(thread: MaybeRef<CommentBubbleModel>) {
  const { resources, projectId } = useInjectedViewerState()
  const router = useRouter()
  const route = useRoute()
  const { zoom } = useCameraUtilities()

  const previousUrl = ref<string | null>(null)

  const loadedModelIds = computed(() => {
    const modelsAndVersions = resources.response.modelsAndVersionIds.value || []
    return modelsAndVersions.map((r) => r.model.id)
  })

  const commentModelIds = computed(() => {
    const threadValue = unref(thread)
    return threadValue.viewerResources.map((r) => r.modelId).filter(Boolean) as string[]
  })

  const isOutOfContext = computed(() =>
    commentModelIds.value.some((id) => !loadedModelIds.value.includes(id))
  )

  const hasClickedFullContext = computed(() => !!previousUrl.value)

  const fullContextUrl = computed(() => {
    const threadValue = unref(thread)
    if (!commentModelIds.value.length) return null

    const modelIdsString = commentModelIds.value.join(',')
    return modelRoute(projectId.value, modelIdsString, { threadId: threadValue.id })
  })

  const isInFullContext = computed(() => {
    if (!fullContextUrl.value) return false
    return window.location.href.includes(fullContextUrl.value)
  })

  const handleContextNavigation = () => {
    if (previousUrl.value) {
      router.push(previousUrl.value)
      previousUrl.value = null
      zoom()
    } else {
      previousUrl.value = route.fullPath
      if (fullContextUrl.value) {
        router.push(fullContextUrl.value)
      }
    }
  }

  return {
    isOutOfContext,
    commentModelIds,
    loadedModelIds,
    fullContextUrl,
    isInFullContext,
    hasClickedFullContext,
    handleContextNavigation
  }
}
