<template>
  <div class="relative">
    <div
      class="absolute pointer-events-auto"
      :style="{
        ...modelValue.style,
        opacity: 1
      }"
    >
      <div ref="threadActivator" class="relative">
        <button
          :class="`
        ${modelValue.isOccluded && !isExpanded ? 'opacity-60 hover:opacity-100' : ''}
        ${isExpanded ? 'outline outline-2 outline-primary' : ''}
        transition bg-foundation shadow hover:shadow-xl flex -space-x-2 items-center p-[2px] rounded-tr-full rounded-tl-full rounded-br-full`"
          @click="onThreadClick"
        >
          <UserAvatarGroup v-if="!modelValue.archived" :users="threadAuthors" />
          <div
            v-if="modelValue.archived"
            class="w-7 h-7 flex items-center justify-center"
          >
            <div
              class="w-6 h-6 flex items-center justify-center bg-primary rounded-full"
            >
              <CheckIcon class="w-3 h-3 text-foundation" />
            </div>
          </div>
        </button>
      </div>
    </div>
    <div
      v-if="isExpanded"
      ref="threadContainer"
      class="thread-container fixed mb-16 bottom-0 right-0 sm:bottom-auto sm:right-auto w-screen sm:w-80 z-50 pointer-events-auto"
      :style="threadStyle"
    >
      <ViewerCommentsPortalOrDiv to="mobileComments">
        <div
          ref="handle"
          class="thread-handle sm:p-1 cursor-move sm:rounded-lg group hover:sm:bg-blue-500/50 h-full transition-all duration-200"
          :class="{ 'is-dragging bg-blue-500/50': isDragging }"
        >
          <div
            :class="[
              'relative bg-foundation dark:bg-foundation-page border border-outline-2 flex flex-col overflow-hidden sm:shadow-md cursor-auto sm:rounded-lg h-full transition-all duration-200',
              'group-[.is-dragging]:bg-foundation'
            ]"
          >
            <div
              class="relative w-full flex justify-between items-center border-b border-outline-2"
              :class="isEmbedEnabled ? 'p-2' : 'p-3 md:px-4'"
            >
              <div class="flex-grow flex items-center gap-x-1.5">
                <FormButton
                  v-tippy="'Previous'"
                  :icon-left="ChevronLeftIcon"
                  color="outline"
                  hide-text
                  size="sm"
                  :disabled="!hasPrevious"
                  @click="emit('prev', modelValue)"
                >
                  <ChevronLeftIcon class="w-3 h-3" />
                </FormButton>
                <FormButton
                  v-tippy="'Next'"
                  :icon-left="ChevronRightIcon"
                  color="outline"
                  hide-text
                  size="sm"
                  :disabled="!hasNext"
                  @click="emit('next', modelValue)"
                />
                <FormButton
                  v-show="isDragged"
                  v-tippy="'Pop in'"
                  :icon-left="ArrowTopRightOnSquareIcon"
                  hide-text
                  class="rotate-180"
                  color="subtle"
                  size="sm"
                  @click="isDragged = false"
                />
              </div>
              <div class="flex gap-x-0.5">
                <FormButton
                  v-tippy="'Copy link'"
                  :icon-left="LinkIcon"
                  hide-text
                  color="subtle"
                  size="sm"
                  @click="onCopyLink"
                />
                <FormButton
                  v-tippy="modelValue.archived ? 'Unresolve' : 'Resolve'"
                  :icon-left="CheckIcon"
                  hide-text
                  :disabled="!canArchiveOrUnarchive"
                  color="subtle"
                  size="sm"
                  @click="toggleCommentResolvedStatus()"
                />
                <FormButton
                  :icon-left="XMarkIcon"
                  hide-text
                  color="subtle"
                  size="sm"
                  @click="changeExpanded(false)"
                />
              </div>
            </div>
            <div
              v-if="showBanner"
              class="flex items-center justify-between gap-4 border-b border-outline-2 py-2 px-4 w-full"
            >
              <div class="text-body-2xs text-foreground-2 font-medium">
                {{ bannerText }}
              </div>
              <div class="-mr-1 flex">
                <FormButton
                  :icon-right="bannerButton.icon"
                  size="sm"
                  color="outline"
                  @click="bannerButton.action"
                >
                  {{ bannerButton.text }}
                </FormButton>
              </div>
            </div>
            <div
              class="relative w-full md:pr-3 sm:w-80 flex flex-col flex-1 justify-between"
            >
              <div
                ref="commentsContainer"
                class="max-h-[200px] sm:max-h-[300px] 2xl:max-h-[500px] overflow-y-auto simple-scrollbar flex flex-col space-y-1 py-2 sm:pr-3"
              >
                <ViewerAnchoredPointThreadComment
                  v-for="comment in comments"
                  :key="comment.id"
                  :comment="comment"
                  :project-id="projectId"
                  @mounted="onCommentMounted"
                />
              </div>
              <div
                v-if="isTypingMessage"
                class="w-full px-3 md:px-4 pb-3 caption mt-1 text-body-2xs"
              >
                {{ isTypingMessage }}
              </div>
            </div>
            <ViewerAnchoredPointThreadNewReply
              v-if="showNewReplyComponent"
              :model-value="modelValue"
              @submit="onNewReply"
            />
            <div
              v-if="isEmbedEnabled"
              class="flex justify-between w-full p-2 border-t border-outline-2"
            >
              <FormButton
                full-width
                :to="getLinkToThread(projectId, props.modelValue)"
                external
                target="_blank"
                size="sm"
                color="outline"
              >
                Reply in Speckle
              </FormButton>
            </div>
            <div
              v-if="!canReply && !isEmbedEnabled && !isLoggedIn"
              class="flex justify-between w-full p-2 border-t border-outline-2"
            >
              <FormButton full-width color="outline" size="sm" @click="$emit('login')">
                Reply
              </FormButton>
            </div>
          </div>
        </div>
      </ViewerCommentsPortalOrDiv>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  LinkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckIcon,
  ArrowTopRightOnSquareIcon,
  ArrowLeftIcon,
  ArrowUpRightIcon
} from '@heroicons/vue/24/outline'
import { ensureError, Roles } from '@speckle/shared'
import type { Nullable } from '@speckle/shared'
import { onKeyDown, useClipboard, useDraggable, onClickOutside } from '@vueuse/core'
import { scrollToBottom } from '~~/lib/common/helpers/dom'
import { useViewerThreadTypingTracking } from '~~/lib/viewer/composables/activity'
import { useAnimatingEllipsis } from '~~/lib/viewer/composables/commentBubbles'
import type { CommentBubbleModel } from '~~/lib/viewer/composables/commentBubbles'
import {
  useArchiveComment,
  useCheckViewerCommentingAccess,
  useMarkThreadViewed,
  useCommentContext
} from '~~/lib/viewer/composables/commentManagement'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { getLinkToThread } from '~~/lib/viewer/helpers/comments'
import { useDisableGlobalTextSelection } from '~~/lib/common/composables/window'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useThreadUtilities } from '~~/lib/viewer/composables/ui'
import { useEmbed } from '~/lib/viewer/composables/setup/embed'

const emit = defineEmits<{
  (e: 'update:modelValue', v: CommentBubbleModel): void
  (e: 'update:expanded', v: boolean): void
  (e: 'next', v: CommentBubbleModel): void
  (e: 'prev', v: CommentBubbleModel): void
  (e: 'login'): void
}>()

const props = defineProps<{
  modelValue: CommentBubbleModel
  hasPrevious?: boolean
  hasNext?: boolean
}>()

const { isEmbedEnabled } = useEmbed()

const threadId = computed(() => props.modelValue.id)
const { copy } = useClipboard()
const { activeUser, isLoggedIn } = useActiveUser()
const archiveComment = useArchiveComment()
const { triggerNotification } = useGlobalToast()
const {
  resources: {
    response: { project }
  }
} = useInjectedViewerState()

const { projectId } = useInjectedViewerState()
const canReply = useCheckViewerCommentingAccess()
const { disableTextSelection } = useDisableGlobalTextSelection()
const markThreadViewed = useMarkThreadViewed()
const { usersTyping } = useViewerThreadTypingTracking(threadId)
const { ellipsis, controls } = useAnimatingEllipsis()
const { threadResourceStatus, hasClickedFullContext, goBack, handleContextClick } =
  useCommentContext()
const { isOpenThread, open, closeAllThreads } = useThreadUtilities()

const commentsContainer = ref(null as Nullable<HTMLElement>)
const threadContainer = ref(null as Nullable<HTMLElement>)
const threadActivator = ref(null as Nullable<HTMLElement>)

onClickOutside(threadContainer, (event) => {
  const viewerElement = document.getElementById('viewer')

  if (
    isExpanded.value &&
    viewerElement &&
    (event.target === viewerElement || viewerElement.contains(event.target as Node)) &&
    !(threadActivator.value && threadActivator.value.contains(event.target as Node))
  ) {
    changeExpanded(false)
  }
})

const handle = ref(null as Nullable<HTMLElement>)
const justCreatedReply = ref(false)

const comments = computed(() => [
  props.modelValue,
  ...props.modelValue.replies.items.slice().reverse()
])

const showNewReplyComponent = computed(() => {
  return !props.modelValue.archived && canReply.value && !isEmbedEnabled.value
})

// Note: conflicted with dragging styles, so took it out temporarily
// const { style } = useExpandedThreadResponsiveLocation({
//   threadContainer,
//   width: 320
// })

const isExpanded = computed(() => isOpenThread(props.modelValue.id))

const isTypingMessage = computed(() => {
  if (!usersTyping.value.length) return null
  return usersTyping.value.length > 1
    ? `${usersTyping.value.map((u) => u.userName).join(', ')} are typing${
        ellipsis.value
      }`
    : `${usersTyping.value[0].userName} is typing${ellipsis.value}`
})

const isViewed = computed(() => !!props.modelValue.viewedAt)

const initialDragPosition = computed(() => {
  return {
    x: props.modelValue.style.x as number,
    y: props.modelValue.style.y as number
  }
})

const mp = useMixpanel()

const isDragged = ref(false)
const { x, y, isDragging, position } = useDraggable(threadContainer, {
  stopPropagation: true,
  handle,
  initialValue: initialDragPosition,
  onStart(_pos, event) {
    // Only allow dragging by border
    const target = event.target as HTMLElement
    if (target !== handle.value) return false

    // Reset pos, if starting dragging from scratch
    if (!isDragged.value) position.value = { x: 0, y: 0 }

    isDragged.value = true
    mp.track('Comment Action', { type: 'action', name: 'drag' })
  }
})

const threadStyle = computed(() => {
  if (!threadActivator.value) return props.modelValue.style

  const activatorRect = threadActivator.value?.getBoundingClientRect()
  const areDraggableCoordsInitialized = x.value && y.value
  const xOffset =
    isDragged.value && areDraggableCoordsInitialized
      ? x.value
      : (props.modelValue.style.x as number) + activatorRect.width + 20
  const threadHeight = threadContainer.value?.getBoundingClientRect().height || 0
  const threadWidth = threadContainer.value?.getBoundingClientRect().width || 0
  const yOffset =
    isDragged.value && areDraggableCoordsInitialized
      ? y.value
      : (props.modelValue.style.y as number) - threadHeight / 2

  // Constrain to viewport boundaries with 10px padding
  const padding = isEmbedEnabled.value ? 5 : 10
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // Use 58px top padding when not in embed mode (to account for the top bar)
  const topPadding = isEmbedEnabled.value ? padding : 58

  // Use 62px bottom padding when in embed mode (to account for the bottom controls)
  const bottomPadding = isEmbedEnabled.value ? 62 : padding

  // Ensure the element stays within the viewport
  const constrainedX = Math.min(
    Math.max(padding, xOffset),
    viewportWidth - threadWidth - padding
  )
  const constrainedY = Math.min(
    Math.max(topPadding, yOffset),
    viewportHeight - threadHeight - bottomPadding
  )

  const transition = isDragged.value ? 'none' : props.modelValue.style.transition
  return {
    ...props.modelValue.style,
    opacity: 1,
    transition,
    transform: `translate(${constrainedX}px,${constrainedY}px)`
  }
})

const threadAuthors = computed(() => {
  const authors = [props.modelValue.author]
  for (const author of props.modelValue.replyAuthors.items) {
    if (!authors.find((u) => u.id === author.id)) authors.push(author)
  }
  return authors
})

const changeExpanded = async (newVal: boolean) => {
  if (newVal) {
    await open(props.modelValue.id)
  } else {
    await closeAllThreads()
  }

  emit('update:expanded', newVal)
  mp.track('Comment Action', {
    type: 'action',
    name: 'toggle',
    status: newVal,
    source: 'bubble'
  })
}

const canArchiveOrUnarchive = computed(
  () =>
    activeUser.value &&
    (props.modelValue.author.id === activeUser.value.id ||
      project.value?.role === Roles.Stream.Owner)
)

const toggleCommentResolvedStatus = async () => {
  await archiveComment({
    commentId: props.modelValue.id,
    projectId: projectId.value,
    archived: !props.modelValue.archived
  })
  mp.track('Comment Action', {
    type: 'action',
    name: 'archive',
    status: props.modelValue.archived
  })
  triggerNotification({
    title: `Thread ${props.modelValue.archived ? 'reopened.' : 'resolved.'}`,
    type: ToastNotificationType.Info
  })
}

const onNewReply = () => {
  justCreatedReply.value = true
  mp.track('Comment Action', { type: 'action', name: 'reply' })
}

const onCommentMounted = () => {
  if (!justCreatedReply.value) return

  const el = commentsContainer.value
  if (!el) return

  scrollToBottom(el)
  justCreatedReply.value = false
}

const onThreadClick = () => {
  changeExpanded(!isExpanded.value)
}

const onCopyLink = async () => {
  if (import.meta.server) return
  const url = getLinkToThread(projectId.value, props.modelValue)
  if (!url) return

  try {
    await copy(new URL(url, window.location.origin).toString())
  } catch (e) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Thread link copy failed',
      description: ensureError(e).message
    })
    throw e
  }

  mp.track('Comment Action', { type: 'action', name: 'share' })

  triggerNotification({
    type: ToastNotificationType.Info,
    title: 'Link copied'
  })
}

onKeyDown('Escape', () => {
  if (isExpanded.value) {
    changeExpanded(false)
  }
})

watch(
  () => [isExpanded.value, isViewed.value] as const,
  (newVals, oldVals) => {
    const [newIsExpanded, newIsViewed] = newVals
    const [oldIsExpanded] = oldVals || [false]

    if (newIsExpanded && newIsExpanded !== oldIsExpanded && !newIsViewed) {
      markThreadViewed(projectId.value, props.modelValue.id)
    }

    if (!newIsExpanded) {
      isDragged.value = false
    }
  },
  { immediate: true } // for triggering also when a comment is opened because of a thread link
)

watch(
  () => usersTyping.value.length > 1,
  (areUsersTyping) => {
    if (areUsersTyping) {
      controls.resume()
    } else {
      controls.pause()
    }
  }
)

watch(isDragging, (newVal, oldVal) => {
  if (!!newVal === !!oldVal) return

  // Disable text selection while dragging around
  disableTextSelection.value = newVal
})

onMounted(() => {
  if (isExpanded.value) {
    // update won't emit if thread was mounted already expanded, so we emit this to close any open thread editors
    emit('update:expanded', true)
  }
})

const showBanner = computed(
  () =>
    threadResourceStatus.value.isDifferentVersion ||
    threadResourceStatus.value.isFederatedModel ||
    hasClickedFullContext.value
)

const bannerText = computed(() => {
  if (hasClickedFullContext.value) return 'Viewing full context'
  if (threadResourceStatus.value.isDifferentVersion)
    return 'Conversation started in a different version'
  if (threadResourceStatus.value.isFederatedModel) return 'References multiple models'
  return ''
})

const bannerButton = computed(() => {
  if (hasClickedFullContext.value) {
    return {
      text: 'Back',
      icon: ArrowLeftIcon,
      action: goBack
    }
  }
  return {
    text: 'Full context',
    icon: ArrowUpRightIcon,
    action: handleContextClick
  }
})
</script>
<style scoped>
@media (max-width: 640px) {
  .thread-container {
    transform: none !important;
  }
}
</style>
