<template>
  <button
    v-tippy="tooltip"
    :aria-label="isHidden ? 'Show' : 'Hide'"
    class="group-hover:opacity-100 hover:bg-highlight-3 rounded-md h-6 w-6 flex items-center justify-center"
    :class="buttonClasses"
    @click.stop="$emit('click', $event)"
  >
    <IconEyeClosed v-if="isHidden" class="w-4 h-4" />
    <IconEye v-else class="w-4 h-4" />
  </button>
</template>

<script setup lang="ts">
import type { Nullable } from '@speckle/shared'

const props = defineProps<{
  isHidden: boolean
  forceVisible?: boolean
  tooltip?: Nullable<object | string>
}>()

defineEmits<{
  click: [event: Event]
}>()

const buttonClasses = computed(() => {
  return {
    'opacity-100': props.isHidden || props.forceVisible,
    'sm:opacity-0': !props.isHidden && !props.forceVisible
  }
})
</script>
