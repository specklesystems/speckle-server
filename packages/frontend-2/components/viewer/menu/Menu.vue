<template>
  <div ref="menuWrapper" class="relative z-30">
    <ViewerControlsButtonToggle
      v-tippy="tooltip"
      flat
      secondary
      :active="open"
      @click="$emit('update:open', !open)"
    >
      <slot name="trigger-icon" />
    </ViewerControlsButtonToggle>
    <div
      v-if="open"
      v-keyboard-clickable
      class="absolute translate-x-0 w-56 left-10 sm:left-12 -top-0 sm:-top-2 bg-foundation max-h-64 simple-scrollbar overflow-y-auto rounded-lg shadow-md flex flex-col"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'

defineProps<{
  tooltip?: string
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const menuWrapper = ref(null)

onClickOutside(menuWrapper, () => {
  emit('update:open', false)
})
</script>
