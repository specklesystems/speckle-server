<template>
  <div
    class="bg-pink-300/0 flex justify-center items-center pointer-events-none transition-all duration-300 ease-in overflow-hidden h-8"
  >
    <FormButton class="pointer-events-auto" @click="trackAndResetFilters">
      Reset filters
    </FormButton>
  </div>
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
