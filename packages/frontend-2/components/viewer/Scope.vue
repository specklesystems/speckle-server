<template>
  <slot v-if="!wrapper" />
  <div v-else>
    <slot />
  </div>
</template>
<script setup lang="ts">
import { useSetupViewerScope } from '~~/lib/viewer/composables/setup'
import type { InjectableViewerState } from '~~/lib/viewer/composables/setup'

const props = defineProps<{
  state: InjectableViewerState
  wrapper?: boolean
}>()

useSetupViewerScope(props.state)
</script>
