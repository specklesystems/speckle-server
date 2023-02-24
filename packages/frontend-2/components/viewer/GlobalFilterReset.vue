<template>
  <div
    v-show="showResetButton"
    class="absolute bottom-4 left-0 w-screen p-2 bg-pink-300/0 flex justify-center pointer-events-none"
  >
    <Transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <FormButton size="sm" class="pointer-events-auto" @click="resetFilters">
        Reset Filters
      </FormButton>
    </Transition>
  </div>
</template>
<script setup lang="ts">
import { useInjectedViewerInterfaceState } from '~~/lib/viewer/composables/setup'
const { filters } = useInjectedViewerInterfaceState()

const showResetButton = computed(() => {
  const f = filters.current.value
  return (
    !!f?.activePropFilterKey ||
    (!!f?.hiddenObjects && f.hiddenObjects.length > 0) ||
    (!!f?.isolatedObjects && f.isolatedObjects.length > 0) ||
    (!!f?.userColorGroups && f.userColorGroups.length > 0)
  )
})

async function resetFilters() {
  await filters.resetFilters()
}
</script>
