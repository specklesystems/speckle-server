<!-- eslint-disable vuejs-accessibility/no-autofocus -->
<template>
  <div
    v-if="shouldShowThreadBubble"
    class="absolute pointer-events-auto"
    :style="{
      ...modelValue.style,
      opacity: 1
    }"
  >
    <div class="relative">
      <button
        v-tippy="!modelValue.isExpanded ? 'New comment' : 'Close'"
        :class="`bg-foundation-2 ${
          modelValue.isExpanded ? 'outline outline-2 outline-primary' : ''
        } rounded-tr-full rounded-tl-full rounded-br-full w-8 h-8 -top-10 absolute flex justify-center items-center hover:shadow-md`"
        @click="onThreadClick"
      >
        <PlusIcon
          :class="`w-5 h-5 text-primary ${
            modelValue.isExpanded ? 'rotate-45' : ''
          } transition`"
        />
      </button>
      <ViewerCommentsPortalOrDiv to="mobileComments">
        <div
          v-if="modelValue.isExpanded && !isEmbedEnabled"
          class="bg-foundation px-2 py-2 text-sm text-primary sm:hidden font-medium flex justify-between items-center"
        >
          Add Comment
          <button v-tippy="'Close'" @click="onThreadClick">
            <PlusIcon class="w-5 h-5 text-primary rotate-45" />
          </button>
        </div>
        <div
          v-if="modelValue.isExpanded && canPostComment"
          ref="threadContainer"
          class="sm:absolute min-w-[200px] bg-foundation sm:rounded-lg shadow-md"
        >
          <div class="relative">
            <ViewerCommentsEditor
              ref="editor"
              v-model="commentValue"
              prompt="Press enter to comment"
              max-height="300px"
              autofocus
              :disabled="isPostingNewThread"
              @submit="() => onSubmit()"
              @keydown="onKeyDownHandler"
            />
            <div class="w-full flex p-2 justify-between">
              <FormButton
                v-tippy="'Attach'"
                :icon-left="PaperClipIcon"
                hide-text
                text
                class="sm:px-1"
                :disabled="isPostingNewThread"
                @click="trackAttachAndOpenFilePicker()"
              />
              <FormButton
                :icon-left="PaperAirplaneIcon"
                hide-text
                :loading="isPostingNewThread"
                @click="() => onSubmit()"
              />
            </div>
          </div>
        </div>
      </ViewerCommentsPortalOrDiv>
    </div>
  </div>
  <div v-else></div>
</template>
<script setup lang="ts">
import { PlusIcon, PaperAirplaneIcon, PaperClipIcon } from '@heroicons/vue/24/solid'
import type { Nullable } from '@speckle/shared'
import { onKeyDown } from '@vueuse/core'
import { useIsTypingUpdateEmitter } from '~~/lib/viewer/composables/commentBubbles'
import type { ViewerNewThreadBubbleModel } from '~~/lib/viewer/composables/commentBubbles'
import { useSubmitComment } from '~~/lib/viewer/composables/commentManagement'
import type { CommentEditorValue } from '~~/lib/viewer/composables/commentManagement'
import {
  isValidCommentContentInput,
  convertCommentEditorValueToInput
} from '~~/lib/viewer/helpers/comments'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useThreadUtilities, useSelectionUtilities } from '~~/lib/viewer/composables/ui'
import { useEmbed } from '~/lib/viewer/composables/setup/embed'

const { isEnabled: isEmbedEnabled } = useEmbed()

const emit = defineEmits<{
  (e: 'update:modelValue', v: ViewerNewThreadBubbleModel): void
  (e: 'close'): void
  (e: 'login'): void
}>()

const props = defineProps<{
  modelValue: ViewerNewThreadBubbleModel
  canPostComment?: Nullable<boolean>
}>()

const { onKeyDownHandler, updateIsTyping, pauseAutomaticUpdates } =
  useIsTypingUpdateEmitter()
const { closeAllThreads, open } = useThreadUtilities()

const editor = ref(null as Nullable<{ openFilePicker: () => void }>)
const commentValue = ref(<CommentEditorValue>{ doc: undefined, attachments: undefined })
const threadContainer = ref(null as Nullable<HTMLElement>)
const isPostingNewThread = ref(false)

// const { style } = useExpandedThreadResponsiveLocation({
//   threadContainer,
//   width: 320
// })
const createThread = useSubmitComment()
const { isLoggedIn } = useActiveUser()
const { objects } = useSelectionUtilities()

const onThreadClick = () => {
  const newIsExpanded = !props.modelValue.isExpanded

  if (!isLoggedIn.value || !props.canPostComment) {
    if (!isLoggedIn.value) {
      emit('login')
    }
    return
  }

  if (!newIsExpanded) {
    updateIsTyping(false)
  }
  emit('update:modelValue', {
    ...props.modelValue,
    isExpanded: newIsExpanded
  })
}

// NOTE: will be used later, keep
// const submitEmoji = (emoji: string) =>
//   onSubmit({ doc: RichTextEditor.convertBasicStringToDocument(emoji) })
const mp = useMixpanel()

const onSubmit = (comment?: CommentEditorValue) => {
  comment ||= comment || commentValue.value
  if (!comment?.doc) return

  const content = convertCommentEditorValueToInput(commentValue.value)
  if (!isValidCommentContentInput(content)) return

  isPostingNewThread.value = true
  pauseAutomaticUpdates.value = true
  updateIsTyping(true) // so that user shows up as typing until the new bubble appears
  createThread(content)
    .then(async (newThread) => {
      const threadId = newThread?.id
      if (!threadId) return

      // switch to new thread
      await open(threadId)
    })
    .finally(() => {
      isPostingNewThread.value = false
      updateIsTyping(false)
      pauseAutomaticUpdates.value = false
    })

  mp.track('Comment Action', { type: 'action', name: 'create' })
  // Marking all uploads as in use to prevent cleanup
  comment.attachments?.forEach((a) => {
    a.inUse = true
  })
}

const trackAttachAndOpenFilePicker = () => {
  editor.value?.openFilePicker()
  mp.track('Comment Action', { type: 'action', name: 'attach' })
}

const shouldShowThreadBubble = computed(() => {
  return props.modelValue.isVisible && objects.value.length > 0
})

onKeyDown('Escape', () => {
  if (props.modelValue.isExpanded) {
    onThreadClick()
  }
})

watch(
  () => props.modelValue.isExpanded,
  async (newVal) => {
    if (newVal) {
      await closeAllThreads()
    }
    commentValue.value = {
      doc: undefined,
      attachments: undefined
    }
  }
)
</script>
