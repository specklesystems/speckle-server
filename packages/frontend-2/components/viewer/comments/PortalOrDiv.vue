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
import { useBreakpoints } from '~~/composables/browser'

const props = defineProps({
  to: String
})

const { isMediaQueryMax } = useBreakpoints()

const isMobile = computed(() => isMediaQueryMax('sm'))
console.log(isMobile.value)
</script>
