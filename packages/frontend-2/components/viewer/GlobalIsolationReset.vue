<template>
  <FormButton
    size="sm"
    color="outline"
    class="pointer-events-auto"
    @click="trackAndResetIsolations"
  >
    Reset isolations
  </FormButton>
</template>
<script setup lang="ts">
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useFilterUtilities } from '~/lib/viewer/composables/filtering/filtering'

const { resetIsolations } = useFilterUtilities()

const mp = useMixpanel()
const trackAndResetIsolations = () => {
  resetIsolations()
  mp.track('Viewer Action', { type: 'action', name: 'isolations', action: 'reset' })
}
</script>
