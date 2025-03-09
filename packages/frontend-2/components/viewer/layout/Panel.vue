<template>
  <div
    class="bg-foundation rounded-lg overflow-hidden border border-outline-2 flex flex-col"
  >
    <div class="sticky top-0 z-50 flex flex-col bg-foundation">
      <div v-if="!hideClose" class="absolute top-1.5 right-1 z-10">
        <FormButton
          color="subtle"
          size="sm"
          hide-text
          :icon-left="XMarkIcon"
          @click="$emit('close')"
        />
      </div>
      <div
        v-if="$slots.title"
        class="flex items-center py-1.5 px-3 border-b border-outline-2"
      >
        <div
          class="flex items-center h-full w-full pr-8 text-body-xs text-foreground font-medium"
        >
          <span class="truncate">
            <slot name="title"></slot>
          </span>
        </div>
      </div>
    </div>
    <div
      v-if="$slots.actions"
      class="flex items-center py-1.5 px-3 relative z-10 border-outline-2"
      :class="moveActionsToBottom ? 'order-3 border-t' : 'order-2 border-b'"
    >
      <slot name="actions"></slot>
    </div>
    <div :class="moveActionsToBottom ? 'order-2' : 'order-3'">
      <slot></slot>
    </div>
  </div>
</template>
<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/solid'
defineEmits(['close'])
defineProps({
  hideClose: {
    type: Boolean,
    default: false
  },
  moveActionsToBottom: {
    type: Boolean,
    default: false
  }
})
</script>
