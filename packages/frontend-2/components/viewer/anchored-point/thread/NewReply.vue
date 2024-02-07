<!-- eslint-disable vuejs-accessibility/no-autofocus -->
<template>
  <div
    class="hidden sm:flex bg-foundation pl-4 pr-3 py-2 sm:py-1.5 rounded-b items-center w-full"
  >
    <FormButton
      :icon-left="PaperClipIcon"
      hide-text
      text
      :disabled="loading || disabled"
      size="sm"
      class="-ml-2 sm:mr-2"
      @click="trackAttachAndOpenFilePicker()"
    />
    <div class="flex flex-col">
      <ViewerCommentsEditor
        ref="editor"
        v-model="commentValue"
        prompt="Press enter to reply"
        autofocus
        max-height="150px"
        :class="disabled ? 'cursor-not-allowed pointer-events-none' : ''"
        @keydown="onKeyDownHandler"
        @submit="onSubmit"
      />
      <p class="text-xs">You don't have permission for that</p>
    </div>
    <FormButton
      :icon-left="PaperAirplaneIcon"
      hide-text
      size="sm"
      color="invert"
      :disabled="loading || disabled"
      class="absolute right-6 sm:right-6"
      @click="onSubmit"
    />
  </div>
</template>
<script setup lang="ts">
import { PaperAirplaneIcon, PaperClipIcon } from '@heroicons/vue/24/solid'
import type { Nullable } from '@speckle/shared'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useIsTypingUpdateEmitter } from '~~/lib/viewer/composables/commentBubbles'
import type { CommentBubbleModel } from '~~/lib/viewer/composables/commentBubbles'
import { useSubmitReply } from '~~/lib/viewer/composables/commentManagement'
import type { CommentEditorValue } from '~~/lib/viewer/composables/commentManagement'
import {
  convertCommentEditorValueToInput,
  isValidCommentContentInput
} from '~~/lib/viewer/helpers/comments'

const props = defineProps<{
  modelValue: CommentBubbleModel
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit'): void
}>()

const createReply = useSubmitReply()
const { onKeyDownHandler, updateIsTyping } = useIsTypingUpdateEmitter()

const loading = ref(false)
const editor = ref(null as Nullable<{ openFilePicker: () => void }>)
const commentValue = ref(<CommentEditorValue>{ doc: undefined, attachments: undefined })
const threadId = computed(() => props.modelValue.id)

const mp = useMixpanel()
const trackAttachAndOpenFilePicker = () => {
  editor.value?.openFilePicker()
  mp.track('Comment Action', { type: 'action', name: 'attach' })
}

const onSubmit = async () => {
  if (!commentValue.value || loading.value) return

  const content = convertCommentEditorValueToInput(commentValue.value)
  if (!isValidCommentContentInput(content)) return

  loading.value = true
  await createReply({
    content,
    threadId: threadId.value
  })
  updateIsTyping(false)

  // Mark all attachments as in use to prevent cleanup
  commentValue.value.attachments?.forEach((a) => {
    a.inUse = true
  })

  commentValue.value = {
    doc: undefined,
    attachments: undefined
  }
  loading.value = false
  emit('submit')
}
</script>
