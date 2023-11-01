<template>
  <div>
    <div v-if="!isMobile">
      <slot></slot>
    </div>
    <Portal v-else :to="props.to">
      <slot></slot>
    </Portal>
  </div>
</template>

<script setup lang="ts">
import { useBreakpoints, Breakpoint } from '~~/lib/common/composables/window'

const props = defineProps({
  to: String
})

const { isMediaQueryMax } = useBreakpoints()

const isMobile = computed(() => isMediaQueryMax(Breakpoint.sm).value)
</script>
