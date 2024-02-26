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
import { useBreakpoints } from '@vueuse/core'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'

const props = defineProps({
  to: String
})

const breakpoints = useBreakpoints(TailwindBreakpoints)
const isMobile = breakpoints.smallerOrEqual('sm')
</script>
