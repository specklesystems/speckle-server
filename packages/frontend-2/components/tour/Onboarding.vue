<template>
  <div
    class="relative max-w-4xl w-screen h-[100dvh] flex items-center justify-center z-50"
  >
    <TourSegmentation v-if="showSegmentation" />
    <TourSlideshow v-else @next="$emit('complete')" />
  </div>
</template>
<script setup lang="ts">
import { useViewerTour } from '~/lib/viewer/composables/tour'
import { useMixpanel } from '~~/lib/core/composables/mp'

defineEmits(['complete'])

const { showSegmentation } = useViewerTour()

const mp = useMixpanel()
watch(showSegmentation, (val) => {
  mp.track('Onboarding Action', {
    type: 'action',
    name: 'step-activation',
    stepName: val ? 'slideshow' : 'segmentation'
  })
})
</script>
