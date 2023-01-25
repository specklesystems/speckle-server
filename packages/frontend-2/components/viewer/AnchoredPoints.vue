<template>
  <div ref="parentEl" class="absolute w-full h-full"></div>
</template>
<script setup lang="ts">
import { Nullable } from '@speckle/shared'
import { useViewerUserActivityTracking } from '~~/lib/viewer/composables/activity'

const parentEl = ref(null as Nullable<HTMLElement>)
const { users } = useViewerUserActivityTracking({ parentEl })
</script>
