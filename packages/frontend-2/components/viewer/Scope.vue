<template>
  <slot v-if="!wrapper" />
  <div v-else>
    <slot />
  </div>
</template>
<script setup lang="ts">
import {
  useSetupViewerScope,
  type InjectableViewerState
} from '~/lib/viewer/composables/setup/core'

const props = defineProps<{
  state: InjectableViewerState
  wrapper?: boolean
}>()

useSetupViewerScope(props.state)
</script>
