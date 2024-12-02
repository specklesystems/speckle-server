<!-- eslint-disable vuejs-accessibility/no-autofocus -->
<template>
  <div
    class="hidden sm:flex bg-foundation pl-4 pr-3 py-2 sm:p-1 sm:pb-3 rounded-b w-full relative flex flex-col"
  >
    <ViewerCommentsEditor
      ref="editor"
      v-model="commentValue"
      prompt="Press enter to reply"
      autofocus
      max-height="150px"
      @keydown="onKeyDownHandler"
      @submit="onSubmit"
    />
    <div class="flex justify-between items-center p-3 pb-0">
      <FormButton
        v-tippy="'Attach'"
        :icon-left="PaperClipIcon"
        hide-text
        text
        :disabled="loading"
        class="sm:px-0"
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
</template>
<script setup lang="ts">
import { PaperAirplaneIcon, PaperClipIcon } from '@heroicons/vue/24/solid'
import type { Nullable } from '@speckle/shared'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
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
}>()

const emit = defineEmits<{
  (e: 'submit'): void
}>()

const createReply = useSubmitReply()
const { onKeyDownHandler, updateIsTyping } = useIsTypingUpdateEmitter()
const { projectId } = useInjectedViewerState()

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
    threadId: threadId.value,
    projectId: projectId.value
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
