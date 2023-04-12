<template>
  <div class="bg-foundation rounded-lg shadow">
    <div
      class="bg-foundation-2 sticky top-0 z-50 flex h-10 items-center justify-between rounded-t-lg px-2 shadow-md"
    >
      <div class="flex items-center w-full"><slot name="actions"></slot></div>
      <div v-if="!hideClose">
        <FormButton size="sm" text @click="$emit('close')">
          <XMarkIcon class="h-3 w-3" />
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
