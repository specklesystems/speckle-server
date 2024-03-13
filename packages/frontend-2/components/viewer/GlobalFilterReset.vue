<template>
  <div
    class="bg-pink-300/0 flex justify-center items-center pointer-events-none transition-all duration-300 ease-in overflow-hidden h-8"
    :class="hasAnyFiltersApplied ? 'translate-y-0' : 'translate-y-16'"
  >
    <FormButton size="sm" class="pointer-events-auto" @click="trackAndResetFilters">
      Reset Filters
    </FormButton>
  </div>
</template>
<script setup lang="ts">
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useFilterUtilities } from '~~/lib/viewer/composables/ui'

const {
  resetFilters,
  filters: { hasAnyFiltersApplied }
} = useFilterUtilities()

const mp = useMixpanel()
const trackAndResetFilters = () => {
  resetFilters()
  mp.track('Viewer Action', { type: 'action', name: 'filters', action: 'reset' })
}
</script>
