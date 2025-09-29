<template>
  <div class="presentation-viewer-setup h-full">
    <ViewerCoreSetup
      viewer-host-classes="h-full"
      :disable-selection="disableSelection"
      :hide-loading-bar="true"
    />
  </div>
</template>
<script setup lang="ts">
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'

defineProps<{
  disableSelection?: boolean
}>()

const emit = defineEmits<{
  (e: 'loading-change', loading: boolean): void
  (e: 'progress-change', progress: number): void
}>()

const {
  ui: { loading, loadProgress }
} = useInjectedViewerState()

watch(loading, (newLoading) => {
  emit('loading-change', newLoading)
})

watch(loadProgress, (newProgress) => {
  emit('progress-change', newProgress)
})
</script>
