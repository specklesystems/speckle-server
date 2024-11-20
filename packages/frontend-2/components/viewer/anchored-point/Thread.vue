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
        ${
          modelValue.isOccluded && !isExpanded
            ? 'grayscale opacity-80 hover:grayscale-0 hover:opacity-100'
            : ''
        }
        ${isExpanded ? 'outline outline-2 outline-primary' : ''}
        transition bg-foundation shadow hover:shadow-xl flex -space-x-2 items-center p-[2px] rounded-tr-full rounded-tl-full rounded-br-full`"
          @click="onThreadClick"
        >
          <!--
            Note: Unsure wether to display just a checkmark for "resolved" threads, or the author list and the checkmark.
            Both optinos are viable, see below. Uncomment to test.
          -->
          <!-- <UserAvatarGroup :users="threadAuthors" /> -->
          <UserAvatarGroup v-if="!modelValue.archived" :users="threadAuthors" />
          <CheckCircleIcon v-if="modelValue.archived" class="w-8 h-8 text-primary" />
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
          class="thread-handle sm:p-1.5 cursor-move sm:rounded-lg group hover:sm:bg-blue-500/50 transition h-full transition-all duration-200"
          :class="{ 'is-dragging bg-blue-500/50': isDragging }"
        >
          <div
            :class="[
              'relative bg-foundation sm:bg-white dark:sm:bg-neutral-800 flex flex-col overflow-hidden sm:shadow-md cursor-auto sm:rounded-lg h-full transition-all duration-200',
              'group-hover:bg-foundation dark:group-hover:bg-neutral-800 group-[.is-dragging]:bg-foundation dark:group-[.is-dragging]:bg-neutral-800'
            ]"
          >
            <div
              class="relative w-full flex justify-between items-center py-2 pl-3 pr-2 sm:px-2 bg-foundation-2"
            >
              <div class="flex-grow flex items-center">
                <FormButton
                  v-tippy="'Previous'"
                  :icon-left="ChevronLeftIcon"
                  text
                  hide-text
                  @click="emit('prev', modelValue)"
                ></FormButton>
                <FormButton
                  v-tippy="'Next'"
                  :icon-left="ChevronRightIcon"
                  text
                  hide-text
                  @click="emit('next', modelValue)"
                ></FormButton>
                <div class="flex-grow"></div>
                <FormButton
                  v-show="isDragged"
                  v-tippy="'Pop in'"
                  :icon-left="ArrowTopRightOnSquareIcon"
                  text
                  hide-text
                  class="rotate-180"
                  @click="isDragged = false"
                ></FormButton>
              </div>
              <div>
                <FormButton
                  v-tippy="modelValue.archived ? 'Unresolve' : 'Resolve'"
                  :icon-left="
                    modelValue.archived ? CheckCircleIcon : CheckCircleIconOutlined
                  "
                  text
                  hide-text
                  :disabled="!canArchiveOrUnarchive"
                  @click="toggleCommentResolvedStatus()"
                ></FormButton>
                <FormButton
                  v-tippy="'Copy link'"
                  :icon-left="LinkIcon"
                  text
                  hide-text
                  @click="onCopyLink"
                ></FormButton>
                <FormButton
                  :icon-left="XMarkIcon"
                  text
                  hide-text
                  @click="changeExpanded(false)"
                ></FormButton>
              </div>
            </div>
            <div
              class="relative w-full pr-3 sm:w-80 flex flex-col flex-1 justify-between pb-4 sm:pb-0"
            >
              <div
                ref="commentsContainer"
                class="max-h-[40vh] sm:max-h-[300px] 2xl:max-h-[500px] overflow-y-auto simple-scrollbar flex flex-col space-y-1 pr-1"
              >
                <div
                  v-if="!isThreadResourceLoaded"
                  class="pl-3 pr-1 py-1 flex items-center justify-between text-xs text-primary bg-primary-muted"
                >
                  <span>Conversation started in a different version.</span>
                  <FormButton
                    v-tippy="'Load thread context'"
                    size="sm"
                    text
                    @click="onLoadThreadContext"
                  >
                    <ArrowDownCircleIcon class="w-5 h-5" />
                  </FormButton>
                </div>
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
                class="bg-foundation rounded-full w-full p-2 caption mt-2"
              >
                {{ isTypingMessage }}
              </div>
            </div>
            <ViewerAnchoredPointThreadNewReply
              v-if="showNewReplyComponent"
              :model-value="modelValue"
              @submit="onNewReply"
            />
            <div v-if="isEmbedEnabled" class="flex justify-between w-full gap-2 p-2">
              <FormButton
                :icon-right="ArrowTopRightOnSquareIcon"
                full-width
                :to="getLinkToThread(projectId, props.modelValue)"
                external
                target="_blank"
              >
                Reply in Speckle
              </FormButton>
            </div>
            <div
              v-if="!canReply && !isEmbedEnabled && !isLoggedIn"
              class="p-3 flex flex-col items-center justify-center bg-foundation-2"
            >
              <FormButton full-width @click="$emit('login')">Reply</FormButton>
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
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/vue/24/solid'
import { CheckCircleIcon as CheckCircleIconOutlined } from '@heroicons/vue/24/outline'
import { ArrowDownCircleIcon } from '@heroicons/vue/20/solid'
import { ensureError, Roles } from '@speckle/shared'
import type { Nullable } from '@speckle/shared'
import { onKeyDown, useClipboard, useDraggable } from '@vueuse/core'
import { scrollToBottom } from '~~/lib/common/helpers/dom'
import { useViewerThreadTypingTracking } from '~~/lib/viewer/composables/activity'
import { useAnimatingEllipsis } from '~~/lib/viewer/composables/commentBubbles'
import type { CommentBubbleModel } from '~~/lib/viewer/composables/commentBubbles'
import {
  useArchiveComment,
  useCheckViewerCommentingAccess,
  useMarkThreadViewed
} from '~~/lib/viewer/composables/commentManagement'
import {
  useInjectedViewerLoadedResources,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { ResourceType } from '~~/lib/common/generated/gql/graphql'
import { getLinkToThread } from '~~/lib/viewer/helpers/comments'
import {
  StateApplyMode,
  useApplySerializedState
} from '~~/lib/viewer/composables/serialization'
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
}>()

const { isEmbedEnabled } = useEmbed()

const threadId = computed(() => props.modelValue.id)
const { copy } = useClipboard()
const { activeUser, isLoggedIn } = useActiveUser()
const { isSmallerOrEqualSm } = useIsSmallerOrEqualThanBreakpoint()

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
const applyState = useApplySerializedState()
const { isOpenThread, open, closeAllThreads } = useThreadUtilities()

const commentsContainer = ref(null as Nullable<HTMLElement>)
const threadContainer = ref(null as Nullable<HTMLElement>)
const threadActivator = ref(null as Nullable<HTMLElement>)

const handle = ref(null as Nullable<HTMLElement>)
const justCreatedReply = ref(false)

const comments = computed(() => [
  props.modelValue,
  ...props.modelValue.replies.items.slice().reverse()
])

const showNewReplyComponent = computed(() => {
  return (
    !props.modelValue.archived &&
    canReply.value &&
    !isSmallerOrEqualSm.value &&
    !isEmbedEnabled.value
  )
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
  const yOffset =
    isDragged.value && areDraggableCoordsInitialized
      ? y.value
      : (props.modelValue.style.y as number) - threadHeight / 2

  const transition = isDragged.value ? 'none' : props.modelValue.style.transition
  return {
    ...props.modelValue.style,
    opacity: 1,
    transition,
    transform: `translate(${xOffset}px,${yOffset}px)`
  }
})

// // TODO: will be used
// const threadEmoji = computed(() => {
//   const cleanVal = props.modelValue.rawText.trim()
//   return emojis.includes(cleanVal) ? cleanVal : undefined
// })

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

const { resourceItems } = useInjectedViewerLoadedResources()

const isThreadResourceLoaded = computed(() => {
  const thread = props.modelValue
  const loadedResources = resourceItems.value
  const resourceLinks = thread.resources

  const objectLinks = resourceLinks
    .filter((l) => l.resourceType === ResourceType.Object)
    .map((l) => l.resourceId)
  const commitLinks = resourceLinks
    .filter((l) => l.resourceType === ResourceType.Commit)
    .map((l) => l.resourceId)

  if (loadedResources.some((lr) => objectLinks.includes(lr.objectId))) return true
  if (loadedResources.some((lr) => lr.versionId && commitLinks.includes(lr.versionId)))
    return true

  return false
})

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
    description: `Thread ${props.modelValue.archived ? 'reopened.' : 'resolved.'}`,
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

const onLoadThreadContext = async () => {
  const state = props.modelValue.viewerState
  if (!state) return

  await applyState(state, StateApplyMode.TheadFullContextOpen)
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
  () => <const>[isExpanded.value, isViewed.value],
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
</script>
<style scoped>
@media (max-width: 640px) {
  .thread-container {
    transform: none !important;
  }
}
</style>
