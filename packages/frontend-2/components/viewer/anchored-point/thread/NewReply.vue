<!-- eslint-disable vuejs-accessibility/no-autofocus -->
<template>
  <div class="relative">
    <ViewerCommentsEditor
      ref="editor"
      v-model="commentValue"
      prompt="Press enter to reply"
      autofocus
      max-height="150px"
      @keydown="onKeyDownHandler"
      @submit="onSubmit"
    />
    <div class="w-full flex justify-end pt-2 space-x-2 p-2">
      <div class="flex space-x-2">
        <FormButton
          :icon-left="PaperClipIcon"
          hide-text
          text
          :disabled="loading"
          @click="trackAttachAndOpenFilePicker()"
        />
        <FormButton
          :icon-left="PaperAirplaneIcon"
          hide-text
          :disabled="loading"
          @click="onSubmit"
        />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { PaperAirplaneIcon, PaperClipIcon } from '@heroicons/vue/24/solid'
import { Nullable } from '@speckle/shared'
import { useMixpanel } from '~~/lib/core/composables/mp'
import {
  CommentBubbleModel,
  useIsTypingUpdateEmitter
} from '~~/lib/viewer/composables/commentBubbles'
import {
  CommentEditorValue,
  useSubmitReply
} from '~~/lib/viewer/composables/commentManagement'
import {
  convertCommentEditorValueToInput,
  isValidCommentContentInput
} from '~~/lib/viewer/helpers/comments'

const props = defineProps<{
  modelValue: CommentBubbleModel
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
