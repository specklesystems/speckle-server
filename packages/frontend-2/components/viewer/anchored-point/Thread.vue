<template>
  <div
    class="absolute pointer-events-auto"
    :style="{
      ...modelValue.style,
      opacity: 1
    }"
  >
    <div class="relative">
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
        <!-- Note: Unsure wether to display just a checkmark for "resolved" threads, or the author list and the checkmark. 
        Both optinos are viable, see below. Uncomment to test. -->
        <!-- <UserAvatarGroup :users="threadAuthors" /> -->
        <UserAvatarGroup v-if="!modelValue.archived" :users="threadAuthors" />
        <CheckCircleIcon v-if="modelValue.archived" class="w-8 h-8 text-primary" />
      </button>
      <div
        v-if="isExpanded"
        ref="threadContainer"
        class="absolute hover:bg-foundation bg-white/80 dark:bg-neutral-800/90 dark:hover:bg-neutral-800 backdrop-blur-sm rounded-lg shadow-md"
        :style="style"
      >
        <div class="relative w-80 flex pt-3">
          <div class="flex-grow">
            <FormButton
              v-tippy="'Previous'"
              size="sm"
              :icon-left="ChevronLeftIcon"
              text
              hide-text
              @click="emit('prev', props.modelValue)"
            ></FormButton>
            <FormButton
              v-tippy="'Next'"
              size="sm"
              :icon-left="ChevronRightIcon"
              text
              hide-text
              @click="emit('next', props.modelValue)"
            ></FormButton>
          </div>
          <div>
            <FormButton
              v-tippy="modelValue.archived ? 'Unresolve' : 'Resolve'"
              size="sm"
              :icon-left="
                modelValue.archived ? CheckCircleIcon : CheckCircleIconOutlined
              "
              text
              hide-text
              :color="modelValue.archived ? 'default' : 'default'"
              :disabled="!canArchiveOrUnarchive"
              @click="toggleCommentResolvedStatus()"
            ></FormButton>
            <FormButton
              v-tippy="'Copy link'"
              size="sm"
              :icon-left="LinkIcon"
              text
              hide-text
            ></FormButton>
            <FormButton
              size="sm"
              :icon-left="XMarkIcon"
              text
              hide-text
              @click="changeExpanded(false)"
            ></FormButton>
          </div>
        </div>
        <div class="relative w-80 flex flex-col">
          <div
            ref="commentsContainer"
            class="max-h-[500px] overflow-y-auto simple-scrollbar flex flex-col space-y-1 pr-1"
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
            class="bg-foundation rounded-full w-full p-2 caption mt-2"
          >
            {{ isTypingMessage }}
          </div>
          <ViewerAnchoredPointThreadNewReply
            v-if="!modelValue.archived"
            :model-value="modelValue"
            class="mt-2"
            @submit="onNewReply"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  LinkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/vue/24/solid'
import { CheckCircleIcon as CheckCircleIconOutlined } from '@heroicons/vue/24/outline'
import { Nullable, Roles } from '@speckle/shared'
import { onKeyDown } from '@vueuse/core'
import { scrollToBottom } from '~~/lib/common/helpers/dom'
import {
  useViewerThreadTracking,
  useViewerThreadTypingTracking
} from '~~/lib/viewer/composables/activity'
import {
  CommentBubbleModel,
  useExpandedThreadResponsiveLocation
} from '~~/lib/viewer/composables/commentBubbles'
import {
  useArchiveComment,
  useMarkThreadViewed
} from '~~/lib/viewer/composables/commentManagement'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { emojis } from '~~/lib/viewer/helpers/emojis'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'

const emit = defineEmits<{
  (e: 'update:modelValue', v: CommentBubbleModel): void
  (e: 'update:expanded', v: boolean): void
  (e: 'next', v: CommentBubbleModel): void
  (e: 'prev', v: CommentBubbleModel): void
}>()

const props = defineProps<{
  modelValue: CommentBubbleModel
}>()

const commentsContainer = ref(null as Nullable<HTMLElement>)
const threadContainer = ref(null as Nullable<HTMLElement>)
const justCreatedReply = ref(false)
const threadId = computed(() => props.modelValue.id)
const comments = computed(() => [
  props.modelValue,
  ...props.modelValue.replies.items.slice().reverse()
])

const {
  projectId,
  ui: { sectionBox }
} = useInjectedViewerState()
const markThreadViewed = useMarkThreadViewed()
const { usersTyping } = useViewerThreadTypingTracking(threadId)

const { style } = useExpandedThreadResponsiveLocation({
  threadContainer,
  width: 320
})

const isExpanded = computed(() => props.modelValue.isExpanded)

const isTypingMessage = computed(() => {
  if (!usersTyping.value.length) return null
  return usersTyping.value.length > 1
    ? `${usersTyping.value.map((u) => u.userName).join(', ')} are typing...`
    : `${usersTyping.value[0].userName} is typing...`
})

const isViewed = computed(() => !!props.modelValue.viewedAt)

// TODO: will be used
const threadEmoji = computed(() => {
  const cleanVal = props.modelValue.rawText.trim()
  return emojis.includes(cleanVal) ? cleanVal : undefined
})

const threadAuthors = computed(() => {
  const authors = [props.modelValue.author]
  for (const author of props.modelValue.replyAuthors.items) {
    if (!authors.find((u) => u.id === author.id)) authors.push(author)
  }
  return authors
})

const setCommentPointOfView = useViewerThreadTracking()
const changeExpanded = (newVal: boolean) => {
  emit('update:modelValue', {
    ...props.modelValue,
    isExpanded: newVal
  })
  emit('update:expanded', newVal)
}
const { activeUser } = useActiveUser()
const archiveComment = useArchiveComment()
const { triggerNotification } = useGlobalToast()
const {
  resources: {
    response: { project }
  }
} = useInjectedViewerState()

const canArchiveOrUnarchive = computed(
  () =>
    activeUser.value &&
    (props.modelValue.author.id === activeUser.value.id ||
      project.value?.role === Roles.Stream.Owner)
)

const toggleCommentResolvedStatus = async () => {
  await archiveComment(props.modelValue.id, !props.modelValue.archived)
  triggerNotification({
    description: `Thread ${props.modelValue.archived ? 'reopened.' : 'resolved.'}`,
    type: ToastNotificationType.Info
  })
}

const onNewReply = () => {
  justCreatedReply.value = true
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

onKeyDown('Escape', () => {
  if (isExpanded.value) {
    changeExpanded(false)
  }
})

// onKeyDown('ArrowRight', () => (isExpanded.value ? emit('prev', props.modelValue) : ''))
// onKeyDown('ArrowLeft', () => (isExpanded.value ? emit('next', props.modelValue) : ''))

watch(
  () => <const>[isExpanded.value, isViewed.value],
  async (newVals, oldVals) => {
    const [newIsExpanded, newIsViewed] = newVals
    const [oldIsExpanded] = oldVals

    if (newIsExpanded && newIsExpanded !== oldIsExpanded && !newIsViewed) {
      markThreadViewed(projectId.value, props.modelValue.id)
    }

    if (newIsExpanded && props.modelValue.data) {
      await setCommentPointOfView(props.modelValue.data)
    }

    if (!newIsExpanded && props.modelValue.data?.sectionBox) {
      sectionBox.sectionBoxOff() // turn off section box if a comment had a section box
    }
  }
)
</script>
