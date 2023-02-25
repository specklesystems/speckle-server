<template>
  <div
    class="absolute pointer-events-auto"
    :style="{
      ...modelValue.style,
      opacity: 1
    }"
  >
    <div class="relative">
      <!-- <button @click="onThreadClick">
        <span v-if="threadEmoji">{{ threadEmoji }}</span>
        <ChatBubbleOvalLeftEllipsisIcon
          v-else-if="!isExpanded && !modelValue.archived"
          class="w-6 h-6"
        />
        <CheckBadgeIcon v-else-if="modelValue.archived" class="w-6 h-6 text-lime-500" />
        <XMarkIcon v-else class="w-6 h-6" />
      </button> -->
      <button
        :class="`${
          isExpanded ? 'outline outline-2 outline-primary' : ''
        } hover:outline-1 hover:outline-primary-muted bg-foundation shadow flex -space-x-1 p-[2px] rounded-tr-full rounded-tl-full rounded-br-full`"
        @click="onThreadClick"
      >
        <UserAvatar :user="modelValue.author" xxxno-border :axxxctive="isExpanded" />
        <!-- <UserAvatar :user="modelValue.author" xxxno-border :active="isExpanded" /> -->
      </button>

      <!-- <FormButton
        :icon-left="
          threadEmoji
            ? undefined
            : isExpanded
            ? XMarkIcon
            : ChatBubbleOvalLeftEllipsisIcon
        "
        :hide-text="!threadEmoji"
        :style="{
          opacity: modelValue.style.opacity
        }"
        :color="isViewed ? 'invert' : 'default'"
        @click="onThreadClick"
      >
        <template v-if="threadEmoji">
          <span>{{ threadEmoji }}</span>
        </template>
      </FormButton> -->
      <div
        v-if="isExpanded"
        ref="threadContainer"
        class="absolute hover:bg-foundation bg-white/80 dark:bg-neutral-900/80 dark:hover:bg-neutral-900 backdrop-blur-sm rounded-lg shadow-md"
        :style="style"
      >
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
            @focusin="setGlobalFocus(true)"
            @focusout="setGlobalFocus(false)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
  CheckBadgeIcon
} from '@heroicons/vue/24/solid'
import { Nullable } from '@speckle/shared'
import { onKeyDown } from '@vueuse/core'
import { scrollToBottom } from '~~/lib/common/helpers/dom'
import { useViewerThreadTypingTracking } from '~~/lib/viewer/composables/activity'
import {
  CommentBubbleModel,
  useExpandedThreadResponsiveLocation
} from '~~/lib/viewer/composables/commentBubbles'
import { useMarkThreadViewed } from '~~/lib/viewer/composables/commentManagement'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { emojis } from '~~/lib/viewer/helpers/emojis'
import { useTextInputGlobalFocus } from '~~/composables/states'

const emit = defineEmits<{
  (e: 'update:modelValue', v: CommentBubbleModel): void
  (e: 'update:expanded', v: boolean): void
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

const { projectId } = useInjectedViewerState()
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
const threadEmoji = computed(() => {
  const cleanVal = props.modelValue.rawText.trim()
  return emojis.includes(cleanVal) ? cleanVal : undefined
})

const changeExpanded = (newVal: boolean) => {
  emit('update:modelValue', {
    ...props.modelValue,
    isExpanded: newVal
  })
  emit('update:expanded', newVal)
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

const globalTextInputFocus = useTextInputGlobalFocus()

function setGlobalFocus(status: boolean) {
  globalTextInputFocus.value = status
}

watch(
  () => <const>[isExpanded.value, isViewed.value],
  (newVals, oldVals) => {
    const [newIsExpanded, newIsViewed] = newVals
    const [oldIsExpanded] = oldVals

    if (newIsExpanded && newIsExpanded !== oldIsExpanded && !newIsViewed) {
      markThreadViewed(projectId.value, props.modelValue.id)
    }
  }
)
</script>
