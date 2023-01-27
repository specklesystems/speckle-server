<template>
  <div class="absolute bottom-4 left-0 w-screen p-2 bg-pink-300/0 flex justify-center">
    <FormButton size="sm">Reset Filters</FormButton>
  </div>
</template>
<script setup lang="ts">
import { useInjectedViewerInterfaceState } from '~~/lib/viewer/composables/setup'
const {
  filters: { current: currentFilters }
} = useInjectedViewerInterfaceState()

const showResetButton = computed(() => {
  const f = currentFilters.value
  return (
    !!f?.activePropFilterKey ||
    (!!f?.hiddenObjects && f.hiddenObjects.length > 0) ||
    (!!f?.isolatedObjects && f.isolatedObjects.length > 0) ||
    (!!f?.userColorGroups && f.userColorGroups.length > 0)
  )
})
</script>
