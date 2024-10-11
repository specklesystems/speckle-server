<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div class="max-w-xl w-screen h-[100dvh] flex items-center justify-center">
    <Transition
      enter-from-class="opacity-0"
      enter-active-class="transition duration-300"
    >
      <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events -->
      <div
        v-show="step === 0"
        class="border border-outline bg-foundation text-foreground backdrop-blur shadow-lg rounded-xl p-4 space-y-2 absolute pointer-events-auto mx-2"
        @mouseenter="rotateGently(Math.random() * 2)"
        @mouseleave="rotateGently(Math.random() * 2)"
      >
        <h2 class="text-center text-heading-lg font-medium">
          Welcome, {{ activeUser?.name?.split(' ')[0] }}!
        </h2>
        <p class="text-center text-body-2xs text-foreground2">
          Let's get to know each other. What industry do you work in?
        </p>
        <div class="grid grid-cols-2 gap-3 pt-2">
          <FormButton
            v-for="val in OnboardingIndustry"
            :key="val"
            class="text-xs hover:scale-[1.05] capitalize"
            size="sm"
            color="outline"
            full-width
            @click="setIndustry(val)"
            @mouseenter="rotateGently(Math.random() * 2)"
            @focus="rotateGently(Math.random() * 2)"
          >
            {{ val }}
          </FormButton>
        </div>
      </div>
    </Transition>
    <Transition
      enter-from-class="opacity-0"
      enter-active-class="transition duration-300"
    >
      <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events -->
      <div
        v-show="step === 1"
        class="bg-foundation border dark:border-neutral-800 text-foreground backdrop-blur shadow-lg rounded-xl p-4 space-y-2 absolute pointer-events-auto mx-2"
        @mouseenter="rotateGently(Math.random() * 2)"
        @mouseleave="rotateGently(Math.random() * 2)"
      >
        <h2 class="text-center text-heading-lg font-medium">Thanks!</h2>
        <p class="text-center text-body-2xs text-foreground2">
          Last thing! Please select the role that best describes you:
        </p>
        <div class="grid grid-cols-2 gap-3 pt-2">
          <FormButton
            v-for="val in OnboardingRole"
            :key="val"
            class="text-xs hover:scale-[1.05]"
            size="sm"
            color="outline"
            full-width
            @click="setRole(val)"
            @mouseenter="rotateGently(Math.random() * 2)"
            @focus="rotateGently(Math.random() * 2)"
          >
            {{ RoleTitleMap[val] }}
          </FormButton>
        </div>
      </div>
    </Transition>
  </div>
</template>
<script setup lang="ts">
import { Vector3 } from 'three'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import {
  OnboardingIndustry,
  OnboardingRole,
  RoleTitleMap
} from '~~/lib/auth/helpers/onboarding'
import type { OnboardingState } from '~~/lib/auth/helpers/onboarding'
import { useProcessOnboarding } from '~~/lib/auth/composables/onboarding'
import { useCameraUtilities } from '~~/lib/viewer/composables/ui'
import { useViewerTour } from '~/lib/viewer/composables/tour'

const { setMixpanelSegments } = useProcessOnboarding()
const {
  setView,
  camera: { position, target }
} = useCameraUtilities()

const onboardingState = ref<OnboardingState>({ industry: undefined, role: undefined })

const { activeUser } = useActiveUser()
const tourState = useViewerTour()

const emit = defineEmits(['next'])

const step = ref(0)

function setIndustry(val: OnboardingIndustry) {
  onboardingState.value.industry = val
  step.value++
  nextView()
}

function setRole(val: OnboardingRole) {
  onboardingState.value.role = val
  step.value++
  nextView()
  // NOTE: workaround for being able to view this in storybook
  if (activeUser.value?.id) setMixpanelSegments(onboardingState.value)
  tourState.showSegmentation.value = false
  emit('next')
}

/** Hardcoded vec3s in Z up space */
const camPos = [
  [23.86779, 82.9541, 29.05586, -27.41942, 37.72358, 29.05586, 0, 1],
  [23.86779, 82.9541, 29.05586, -27.41942, 37.72358, 29.05586, 0, 1],
  [27.22726, 2.10995, 27.98292, -27.31762, 36.15982, 27.98292, 0, 1],
  [-42.39747, 72.34078, 29.54059, -25.71981, 35.86063, 29.54059, 0, 1],
  [27.22726, 2.10995, 27.98292, -27.31762, 36.15982, 27.98292, 0, 1],
  [-25.89795, 12.51216, 59.41238, -21.55546, 37.76445, 32.52495, 0, 1]
]

let flip = 1
const rotateGently = (factor = 1) => {
  setView({ azimuth: (Math.PI / 12) * flip * factor, polar: 0 }, true)
  flip *= -1
}

function nextView() {
  position.value = new Vector3(
    camPos[step.value][0],
    camPos[step.value][1],
    camPos[step.value][2]
  )
  target.value = new Vector3(
    camPos[step.value][3],
    camPos[step.value][4],
    camPos[step.value][5]
  )
}
</script>
