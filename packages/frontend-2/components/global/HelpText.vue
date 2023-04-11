<template>
  <span
    v-tippy="{ content: text, trigger: triggerValue }"
    class="border-foreground border-b border-dashed cursor-help"
  >
    <slot />
  </span>
</template>
<script setup lang="ts">
type TriggerType = 'hover' | 'click'

const props = withDefaults(
  defineProps<{
    text: string
    trigger?: TriggerType
  }>(),
  {
    trigger: 'click'
  }
)

const triggerValue = computed(() => {
  switch (props.trigger) {
    case 'click':
      return 'click'
    case 'hover':
    default:
      return 'mouseenter focus'
  }
})
</script>
