<!-- eslint-disable vuejs-accessibility/no-autofocus -->
<template>
  <div class="relative">
    <ViewerCommentsEditor
      ref="editor"
      v-model="commentValue"
      prompt="Press enter to reply"
      autofocus
      max-height="150px"
      @update:model-value="onInput"
      @submit="onSubmit"
    />
    <div class="w-full flex justify-end pt-2 space-x-2 p-2">
      <div class="flex space-x-2">
        <FormButton
          :icon-left="PaperClipIcon"
          hide-text
          text
          :disabled="loading"
          @click="editor?.openFilePicker"
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
import { debounce } from 'lodash-es'
import { Nullable } from '@speckle/shared'
import { useOnBeforeWindowUnload } from '~~/lib/common/composables/window'
import { useViewerUserActivityBroadcasting } from '~~/lib/viewer/composables/activity'
import { CommentBubbleModel } from '~~/lib/viewer/composables/commentBubbles'
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

const { emitTyping } = useViewerUserActivityBroadcasting()
const createReply = useSubmitReply()

const loading = ref(false)
const isTyping = ref(false)
const editor = ref(null as Nullable<{ openFilePicker: () => void }>)
const commentValue = ref(<CommentEditorValue>{ doc: undefined, attachments: undefined })
const threadId = computed(() => props.modelValue.id)

const updateIsTyping = async (isTyping: boolean) =>
  emitTyping({
    threadId: threadId.value,
    isTyping
  })

const onInput = () => {
  if (!isTyping.value) {
    isTyping.value = true
  }
  debouncedMarkNoLongerTyping()
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

const debouncedMarkNoLongerTyping = debounce(() => (isTyping.value = false), 7000)

watch(isTyping, (newVal) => updateIsTyping(newVal))
onBeforeUnmount(() => updateIsTyping(false))
useOnBeforeWindowUnload(() => updateIsTyping(false))
</script>
