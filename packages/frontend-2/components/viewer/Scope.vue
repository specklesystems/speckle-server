<template>
  <slot />
</template>
<script setup lang="ts">
import {
  InjectableViewerState,
  useSetupViewerScope
} from '~~/lib/viewer/composables/setup'

const props = defineProps<{
  state: InjectableViewerState
}>()

useSetupViewerScope(props.state)
</script>
