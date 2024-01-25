<template>
  <div class="bg-foundation rounded-lg overflow-hidden shadow flex flex-col">
    <div class="sticky top-0 z-50 flex flex-col bg-foundation">
      <div
        v-if="!hideClose"
        class="absolute top-1.5 sm:top-2 right-0.5 sm:right-0 z-10"
      >
        <FormButton size="sm" color="secondary" text @click="$emit('close')">
          <XMarkIcon class="h-4 w-4 sm:h-3 sm:w-3 text-primary sm:text-foreground" />
        </FormButton>
      </div>
      <div
        v-if="$slots.title"
        class="flex items-center py-2 px-3 border-b border-outline-3 dark:border-foundation-2 bg-foundation"
      >
        <div
          class="flex items-center h-full w-full pr-8 font-semibold sm:font-bold text-sm text-primary"
        >
          <span class="truncate">
            <slot name="title"></slot>
          </span>
        </div>
      </div>
    </div>
    <div
      v-if="$slots.actions"
      class="flex items-center py-1 sm:py-2 gap-2 px-2"
      :class="
        moveActionsToBottom
          ? 'order-3 border-t border-outline-3 mt-2'
          : 'order-2 shadow-md'
      "
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
