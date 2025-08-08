<template>
  <button
    v-tippy="getTooltipProps(isHidden ? 'Show' : 'Hide')"
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
const props = defineProps<{
  isHidden: boolean
  forceVisible?: boolean
}>()

defineEmits<{
  click: [event: Event]
}>()

const { getTooltipProps } = useSmartTooltipDelay()

const buttonClasses = computed(() => {
  return {
    'opacity-100': props.isHidden || props.forceVisible,
    'sm:opacity-0': !props.isHidden && !props.forceVisible
  }
})
</script>
