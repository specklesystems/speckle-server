<template>
  <div class="relative">
    <div class="bg-foundation rounded-full w-80 p-4 flex flex-col">
      <FormTextInput
        full-width
        name="newComment"
        class="bg-transparent focus:ring-0 focus:outline-0"
        placeholder="Press enter to send"
        @input="onInput"
      />
    </div>
    <div class="absolute w-full flex justify-end pt-2 space-x-2">
      <div class="flex space-x-2">
        <FormButton :icon-left="PaperClipIcon" hide-text color="invert" />
        <FormButton :icon-left="PaperAirplaneIcon" hide-text />
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

const props = defineProps<{
  modelValue: CommentBubbleModel
}>()

const { emitTyping } = useViewerUserActivityBroadcasting()

const isTyping = ref(false)
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

const debouncedMarkNoLongerTyping = debounce(() => (isTyping.value = false), 7000)

watch(isTyping, (newVal) => updateIsTyping(newVal))
onBeforeUnmount(() => updateIsTyping(false))
useOnBeforeWindowUnload(() => updateIsTyping(false))
</script>
