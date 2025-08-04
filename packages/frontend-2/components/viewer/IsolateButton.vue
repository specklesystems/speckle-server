<template>
  <button
    v-tippy="tooltip"
    class="group-hover:opacity-100 rounded-md h-6 w-6 flex items-center justify-center"
    :class="{
      'opacity-100 hover:bg-highlight-1': isIsolated,
      'opacity-100 hover:bg-highlight-3': !isIsolated && forceVisible,
      'sm:opacity-0 hover:bg-highlight-3': !isIsolated && !forceVisible
    }"
    @click.stop="$emit('click', $event)"
  >
    <IconViewerUnisolate v-if="isIsolated" class="w-3.5 h-3.5" />
    <IconViewerIsolate v-else class="w-3.5 h-3.5" />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  isIsolated: boolean
  forceVisible?: boolean
  tooltip?: object | string | null
}>()

defineEmits<{
  click: [event: Event]
}>()
</script>
