<template>
  <div>The render list {{ projectId }} // {{ versionId }}</div>
</template>
<script setup lang="ts">
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
const {
  projectId,
  resources: {
    response: { resourceItems }
  },
  viewer: { instance: viewerInstance }
} = useInjectedViewerState()

const versionId = computed(() => {
  return resourceItems.value[0].versionId as string
})
</script>
