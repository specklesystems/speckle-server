<template>
  <FormButton
    size="sm"
    color="outline"
    class="pointer-events-auto"
    @click="trackAndResetFilters"
  >
    Reset filters
  </FormButton>
</template>
<script setup lang="ts">
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useFilterUtilities } from '~~/lib/viewer/composables/ui'

const { resetFilters } = useFilterUtilities()

const mp = useMixpanel()
const trackAndResetFilters = () => {
  resetFilters()
  mp.track('Viewer Action', { type: 'action', name: 'filters', action: 'reset' })
}
</script>
