<template>
  <div
    class="relative max-w-4xl w-screen h-[100dvh] flex items-center justify-center z-50"
  >
    <TourSegmentation v-if="showSegmentation && step === 0" @next="step++" />
    <TourSlideshow v-if="step === 1" @next="step++" />
    <!-- <OnboardingDialogManager v-if="step === 2" allow-escape @cancel="step++" /> -->
    <div
      v-if="step === 2 && !hasCompletedChecklistV1"
      class="relative w-full pointer-events-auto space-y-2 z-50"
    >
      <div
        v-if="!isSmallerOrEqualSm"
        class="pointer-events-none fixed inset-0 bg-neutral-100/70 dark:bg-neutral-900/70 transition-opacity z-50"
      />
      <div v-if="!isSmallerOrEqualSm" class="relative z-50">
        <OnboardingChecklistV1 show-bottom-escape background @dismiss="step++" />
      </div>
      <div v-else class="fixed bottom-10 left-0 w-screen z-50 p-10">
        <div class="bg-foundation p-2 rounded-md text-sm">
          There's more to Speckle - be sure to visit on a computer. Since you're on a
          mobile device, feel free to keep exploring the web app!
          <FormButton class="w-full mt-4" @click="step++">Let's go!</FormButton>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useViewerTour } from '~/lib/viewer/composables/tour'
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'
import { useMixpanel } from '~~/lib/core/composables/mp'

const { isSmallerOrEqualSm } = useIsSmallerOrEqualThanBreakpoint()

const step = ref(0)
const hasCompletedChecklistV1 = useSynchronizedCookie<boolean>(
  `hasCompletedChecklistV1`,
  { default: () => false }
)

const { showSegmentation } = useViewerTour()

const mp = useMixpanel()
watch(step, (val) => {
  let stepName = 'segmentation'
  if (val === 1) stepName = 'slideshow'
  if (val === 2) stepName = 'checklist'
  mp.track('Onboarding Action', {
    type: 'action',
    name: 'step-activation',
    step: val,
    stepName
  })
})
</script>
