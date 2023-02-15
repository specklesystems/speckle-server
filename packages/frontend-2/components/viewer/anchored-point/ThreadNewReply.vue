<!-- eslint-disable vuejs-accessibility/no-autofocus -->
<template>
  <div class="relative">
    <div class="bg-foundation rounded-4xl w-80 p-4 flex flex-col">
      <ViewerCommentsEditor
        v-model="commentValue"
        autofocus
        max-height="150px"
        @update:model-value="onInput"
        @submit="onSubmit"
      />
    </div>
    <div class="absolute w-full flex justify-end pt-2 space-x-2">
      <div class="flex space-x-2">
        <FormButton
          :icon-left="PaperClipIcon"
          hide-text
          color="invert"
          :disabled="loading"
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
import { useOnBeforeWindowUnload } from '~~/lib/common/composables/window'
import { useViewerUserActivityBroadcasting } from '~~/lib/viewer/composables/activity'
import { CommentBubbleModel } from '~~/lib/viewer/composables/commentBubbles'
import {
  CommentEditorValue,
  useSubmitReply
} from '~~/lib/viewer/composables/commentManagement'

const props = defineProps<{
  modelValue: CommentBubbleModel
}>()

const { emitTyping } = useViewerUserActivityBroadcasting()
const createReply = useSubmitReply()

const loading = ref(false)
const isTyping = ref(false)
const commentValue = ref(<CommentEditorValue>{ doc: undefined })
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
  if (!commentValue.value.doc || loading.value) return

  // TODO: attachments
  loading.value = true
  await createReply({
    content: {
      doc: commentValue.value.doc,
      blobIds: []
    },
    threadId: threadId.value
  })
  commentValue.value = {
    doc: undefined,
    attachments: undefined
  }
  loading.value = false
}

const debouncedMarkNoLongerTyping = debounce(() => (isTyping.value = false), 7000)

watch(isTyping, (newVal) => updateIsTyping(newVal))
onBeforeUnmount(() => updateIsTyping(false))
useOnBeforeWindowUnload(() => updateIsTyping(false))
</script>
