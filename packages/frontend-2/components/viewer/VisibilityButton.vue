<template>
  <button
    v-tippy="tooltip"
    class="group-hover:opacity-100 hover:bg-highlight-3 rounded-md h-6 w-6 flex items-center justify-center"
    :class="{
      'opacity-100': isHidden || forceVisible,
      'sm:opacity-0': !isHidden && !forceVisible
    }"
    @click.stop="$emit('click', $event)"
  >
    <IconEyeClosed v-if="isHidden" class="w-4 h-4" />
    <IconEye v-else class="w-4 h-4" />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  isHidden: boolean
  forceVisible?: boolean
  tooltip?: object | string | null
}>()

defineEmits<{
  click: [event: Event]
}>()
</script>
