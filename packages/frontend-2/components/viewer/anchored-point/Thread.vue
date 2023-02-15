<template>
  <div
    class="absolute pointer-events-auto"
    :style="{
      ...modelValue.style,
      opacity: 1
    }"
  >
    <div class="relative">
      <FormButton
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
      </FormButton>
      <div v-if="isExpanded" ref="threadContainer" class="absolute" :style="style">
        <div class="relative w-80 flex flex-col">
          <div
            class="max-h-[500px] overflow-y-auto simple-scrollbar flex flex-col space-y-1 pr-1"
          >
            <ViewerAnchoredPointThreadComment
              v-for="comment in comments"
              :key="comment.id"
              :comment="comment"
            />
          </div>
          <div
            v-if="isTypingMessage"
            class="bg-foundation rounded-full w-full p-2 caption mt-2"
          >
            {{ isTypingMessage }}
          </div>
          <ViewerAnchoredPointThreadNewReply :model-value="modelValue" class="mt-2" />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ChatBubbleOvalLeftEllipsisIcon, XMarkIcon } from '@heroicons/vue/24/solid'
import { Nullable } from '@speckle/shared'
import { onKeyDown } from '@vueuse/core'
import { useViewerThreadTypingTracking } from '~~/lib/viewer/composables/activity'
import {
  CommentBubbleModel,
  useExpandedThreadResponsiveLocation
} from '~~/lib/viewer/composables/commentBubbles'
import { useMarkThreadViewed } from '~~/lib/viewer/composables/commentManagement'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { emojis } from '~~/lib/viewer/helpers/emojis'

const emit = defineEmits<{
  (e: 'update:modelValue', v: CommentBubbleModel): void
  (e: 'update:expanded', v: boolean): void
}>()

const props = defineProps<{
  modelValue: CommentBubbleModel
}>()

const threadId = computed(() => props.modelValue.id)
const threadContainer = ref(null as Nullable<HTMLElement>)
const comments = computed(() => [
  props.modelValue,
  ...props.modelValue.replies.items.slice().reverse()
])

const { projectId } = useInjectedViewerState()
const { markThreadViewed } = useMarkThreadViewed()
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

const onThreadClick = () => {
  changeExpanded(!isExpanded.value)
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
    const [oldIsExpanded] = oldVals

    if (newIsExpanded && newIsExpanded !== oldIsExpanded && !newIsViewed) {
      markThreadViewed(projectId.value, props.modelValue.id)
    }
  }
)
</script>
