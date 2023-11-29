<template>
  <slot />
</template>
<script setup lang="ts">
import { useSetupViewerScope } from '~~/lib/viewer/composables/setup'
import type { InjectableViewerState } from '~~/lib/viewer/composables/setup'

const props = defineProps<{
  state: InjectableViewerState
}>()

useSetupViewerScope(props.state)
</script>
