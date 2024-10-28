<template>
  <div
    class="relative max-w-4xl w-screen h-[100dvh] flex items-center justify-center z-50"
  >
    <TourSegmentation v-if="showSegmentation && step === 0" @next="step++" />
    <TourSlideshow v-if="step === 1" @next="goToDashboard" />
  </div>
</template>
<script setup lang="ts">
import { homeRoute } from '~/lib/common/helpers/route'
import { useViewerTour } from '~/lib/viewer/composables/tour'
import { useMixpanel } from '~~/lib/core/composables/mp'

const { showSegmentation } = useViewerTour()
const router = useRouter()

const step = ref(0)

const goToDashboard = () => {
  router.push(homeRoute)
}

const mp = useMixpanel()
watch(step, (val) => {
  let stepName = 'segmentation'
  if (val === 1) stepName = 'slideshow'
  mp.track('Onboarding Action', {
    type: 'action',
    name: 'step-activation',
    step: val,
    stepName
  })
})
</script>
