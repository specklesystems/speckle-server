<template>
  <button
    v-tippy="tooltip"
    :aria-label="isIsolated ? 'Unisolate' : 'Isolate'"
    class="group-hover:opacity-100 rounded-md h-6 w-6 flex items-center justify-center"
    :class="buttonClasses"
    @click.stop="$emit('click', $event)"
  >
    <IconViewerUnisolate v-if="isIsolated" class="w-3.5 h-3.5" />
    <IconViewerIsolate v-else class="w-3.5 h-3.5" />
  </button>
</template>

<script setup lang="ts">
import type { Nullable } from '@speckle/shared'

const props = defineProps<{
  isIsolated: boolean
  forceVisible?: boolean
  tooltip?: Nullable<object | string>
}>()

defineEmits<{
  click: [event: Event]
}>()

const buttonClasses = computed(() => {
  return {
    'opacity-100 hover:bg-highlight-1': props.isIsolated,
    'opacity-100 hover:bg-highlight-3': !props.isIsolated && props.forceVisible,
    'sm:opacity-0 hover:bg-highlight-3': !props.isIsolated && !props.forceVisible
  }
})
</script>
