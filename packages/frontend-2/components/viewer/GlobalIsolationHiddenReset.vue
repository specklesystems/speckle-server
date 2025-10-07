<template>
  <FormButton
    size="sm"
    color="outline"
    class="pointer-events-auto"
    @click="trackAndReset"
  >
    {{ buttonText }}
  </FormButton>
</template>
<script setup lang="ts">
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useFilterUtilities } from '~/lib/viewer/composables/filtering/filtering'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'

const viewerState = useInjectedViewerState()
const { resetHiddenAndIsolations, hasAnyIsolationsApplied, hasAnyHiddenApplied } =
  useFilterUtilities({ state: viewerState })

const buttonText = computed(() => {
  const hasIsolations = hasAnyIsolationsApplied.value
  const hasHidden = hasAnyHiddenApplied.value

  if (hasIsolations && hasHidden) {
    return 'Reset isolations/hidden'
  } else if (hasIsolations) {
    return 'Reset isolations'
  } else if (hasHidden) {
    return 'Reset hidden'
  }
  return 'Reset'
})

const mp = useMixpanel()
const trackAndReset = () => {
  const hasIsolations = hasAnyIsolationsApplied.value
  const hasHidden = hasAnyHiddenApplied.value

  resetHiddenAndIsolations()

  if (hasIsolations && hasHidden) {
    mp.track('Viewer Action', {
      type: 'action',
      name: 'isolations-hidden',
      action: 'reset'
    })
  } else if (hasIsolations) {
    mp.track('Viewer Action', { type: 'action', name: 'isolations', action: 'reset' })
  } else if (hasHidden) {
    mp.track('Viewer Action', { type: 'action', name: 'hidden', action: 'reset' })
  }
}
</script>
