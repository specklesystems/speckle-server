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
        :icon-left="ChatBubbleOvalLeftEllipsisIcon"
        hide-text
        :style="{
          opacity: modelValue.style.opacity
        }"
        @click="onThreadClick"
      />
      <div
        v-if="modelValue.isExpanded"
        class="absolute"
        :style="{
          top: '50%',
          left: 'calc(100% + 12px)',
          transformOrigin: 'center center',
          transform: 'translateY(-50%)'
        }"
      >
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
          <ViewerAnchoredPointThreadNewReply class="mt-2" />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/vue/24/solid'
import { CommentBubbleModel } from '~~/lib/viewer/composables/commentBubbles'

const emit = defineEmits<{
  (e: 'update:modelValue', v: CommentBubbleModel): void
}>()

const props = defineProps<{
  modelValue: CommentBubbleModel
}>()

const comments = computed(() => [props.modelValue, ...props.modelValue.replies.items])

const onThreadClick = () => {
  emit('update:modelValue', {
    ...props.modelValue,
    isExpanded: !props.modelValue.isExpanded
  })
}
</script>
