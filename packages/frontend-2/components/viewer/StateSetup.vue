<template>
  <div class="viewer-state-setup">
    <ViewerStatePostSetup><slot /></ViewerStatePostSetup>
  </div>
</template>
<script setup lang="ts">
import {
  useSetupViewer,
  type UseSetupViewerParams
} from '~/lib/viewer/composables/setup'
import type { InjectableViewerState } from '~/lib/viewer/composables/setup/core'

const emit = defineEmits<{
  setup: [InjectableViewerState]
}>()

const props = defineProps<{
  // Passing in a wrapper object so that the refs don't get unwrapped. We want the full
  // AsyncWritableComputed objects here
  initParams: UseSetupViewerParams
}>()

// initParams isnt reactive, but the refs inside of it definitely are
const state = useSetupViewer(props.initParams)
emit('setup', state)
</script>
