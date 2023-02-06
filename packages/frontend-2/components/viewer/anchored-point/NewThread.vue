<template>
  <div
    v-if="modelValue.isVisible"
    class="absolute pointer-events-auto"
    :style="{
      ...modelValue.style,
      opacity: 1
    }"
  >
    <div class="relative">
      <FormButton
        :icon-left="PlusIcon"
        hide-text
        :style="{ opacity: modelValue.style.opacity }"
        @click="onThreadClick"
      />
      <div
        v-if="modelValue.isExpanded"
        ref="threadContainer"
        class="absolute"
        :style="style"
      >
        <div class="relative">
          <div class="bg-foundation rounded-full w-80 p-4 flex flex-col">
            <ViewerCommentsEditor v-model="commentValue" max-height="60vh" />
            <!-- <FormTextInput
              full-width
              name="newComment"
              class="bg-transparent focus:ring-0 focus:outline-0"
              placeholder="Press enter to send"
            /> -->
          </div>
          <div class="absolute w-full flex justify-between pt-2 space-x-2">
            <div class="flex space-x-2">
              <FormButton
                :icon-left="HeartIcon"
                hide-text
                color="invert"
                class="text-red-600"
              />
              <FormButton
                :icon-left="ExclamationTriangleIcon"
                hide-text
                color="invert"
                class="text-orange-500"
              />
              <FormButton
                :icon-left="FireIcon"
                hide-text
                color="invert"
                class="text-red-600"
              />
            </div>
            <div class="space-x-2">
              <FormButton :icon-left="PaperClipIcon" hide-text color="invert" />
              <FormButton :icon-left="PaperAirplaneIcon" hide-text />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  HeartIcon,
  PlusIcon,
  FireIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  PaperClipIcon
} from '@heroicons/vue/24/solid'
import { Nullable, Optional } from '@speckle/shared'
import { JSONContent } from '@tiptap/core'
import {
  useExpandedThreadResponsiveLocation,
  ViewerNewThreadBubbleModel
} from '~~/lib/viewer/composables/commentBubbles'

const emit = defineEmits<{
  (e: 'update:modelValue', v: ViewerNewThreadBubbleModel): void
}>()

const props = defineProps<{
  modelValue: ViewerNewThreadBubbleModel
}>()

const commentValue = ref({ doc: undefined as Optional<JSONContent> })
const threadContainer = ref(null as Nullable<HTMLElement>)

const onThreadClick = () => {
  emit('update:modelValue', {
    ...props.modelValue,
    isExpanded: !props.modelValue.isExpanded
  })
}

const { style } = useExpandedThreadResponsiveLocation({
  threadContainer,
  width: 320
})
</script>
