<template>
  <div class="sm:bg-foundation rounded-lg shadow">
    <div
      class="sm:bg-foundation-2 sticky top-0 z-50 flex h-10 items-center justify-between rounded-t-lg sm:px-2 sm:shadow-md"
    >
      <div class="flex items-center w-full"><slot name="actions"></slot></div>
      <div v-if="!hideClose">
        <FormButton size="sm" text @click="$emit('close')">
          <XMarkIcon class="h-4 w-4 sm:h-3 sm:w-3" />
        </FormButton>
      </div>
    </div>
    <div>
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
  }
})
</script>
