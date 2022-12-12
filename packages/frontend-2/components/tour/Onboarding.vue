<template>
  <div class="max-w-xl w-screen h-screen flex items-center justify-center">
    <Transition
      enter-from-class="opacity-0"
      enter-active-class="transition duration-300"
    >
      <div
        v-show="step === 0"
        class="bg-white/60 dark:bg-white/60 dark:text-foundation backdrop-blur-sm rounded-md p-4 space-y-4 absolute pointer-events-auto"
        @mouseenter="rotateGently(Math.random() * 2)"
        @focus="rotateGently(Math.random() * 2)"
      >
        <h2 class="text-center text-2xl font-bold">
          Welcome, {{ activeUser?.name?.split(' ')[0] }}!
        </h2>
        <p class="text-center">
          Let's get to know each other. What industry do you work in?
        </p>
        <div class="grid grid-cols-3 gap-4">
          <FormButton
            v-for="(val, title) in OnboardingIndustry"
            :key="val"
            color="card"
            size="sm"
            @click="setIndustry(val)"
            @mouseenter="rotateGently(Math.random() * 2)"
            @focus="rotateGently(Math.random() * 2)"
          >
            {{ title }}
          </FormButton>
        </div>
      </div>
    </Transition>
    <Transition
      enter-from-class="opacity-0"
      enter-active-class="transition duration-300"
    >
      <div
        v-show="step === 1"
        class="bg-white/60 dark:bg-white/60 dark:text-foundation backdrop-blur-sm rounded-md p-4 space-y-4 absolute pointer-events-auto"
        @mouseenter="rotateGently(Math.random() * 2)"
        @focus="rotateGently(Math.random() * 2)"
      >
        <h2 class="text-center text-2xl font-bold">Thanks!</h2>
        <p class="text-center">One last thing. What's your job title?</p>
        <div class="grid grid-cols-2 gap-4">
          <FormButton
            v-for="val in OnboardingRole"
            :key="val"
            color="card"
            size="sm"
            @click="setRole(val)"
            @mouseenter="rotateGently(Math.random() * 2)"
            @focus="rotateGently(Math.random() * 2)"
          >
            {{ RoleTitleMap[val] }}
          </FormButton>
        </div>
      </div>
    </Transition>
    <Transition
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
      enter-active-class="transition duration-300"
      leave-active-class="transition duration-300"
    >
      <div v-show="step === 2" class="absolute pointer-events-auto max-w-xl">
        <div class="grid grid-cols-2 space-x-4 text-center">
          <div
            class="bg-white/70 hover:bg-white/95 dark:text-foundation backdrop-blur-sm rounded-md p-4 group hover:scale-105 transition flex flex-col space-y-5 place-content-between"
          >
            <h4 class="h2 font-bold group-hover:text-primary">Connect</h4>
            <p class="label">
              Start sending and receiving data from Revit, Rhino, Grasshopper, Autocad
              and more.
            </p>
            <FormButton
              full-width
              :icon-right="CloudArrowDownIcon"
              to="/download-manager"
            >
              Download Manager
            </FormButton>
          </div>
          <div
            class="bg-white/70 hover:bg-white/95 dark:text-foundation backdrop-blur-sm rounded-md p-4 group hover:scale-105 transition flex flex-col w-full space-y-5 place-content-between"
            @mouseenter="rotateGently()"
            @mouseleave="rotateGently()"
            @focusin="rotateGently()"
            @focusout="rotateGently()"
          >
            <h4 class="h2 font-bold group-hover:text-primary">Explore</h4>
            <p class="label">See what Speckle has to offer in this sample project!</p>
            <FormButton full-width :icon-right="PlusCircleIcon" @click="step = 4">
              Start Tour
            </FormButton>
          </div>
        </div>
        <div class="text-center mt-2">
          <FormButton class="shadow-lg ml-3" color="invert" rounded size="xs" to="/">
            Skip
          </FormButton>
        </div>
      </div>
    </Transition>
    <div v-if="step === 4">
      <TourSlideshow />
    </div>
  </div>
</template>
<script setup lang="ts">
import { CloudArrowDownIcon, PlusCircleIcon } from '@heroicons/vue/24/solid'
import { Viewer } from '@speckle/viewer'
import { Vector3 } from 'three'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import {
  OnboardingIndustry,
  OnboardingRole,
  RoleTitleMap,
  OnboardingState
} from '~~/lib/auth/helpers/onboarding'
import { useProcessOnboarding } from '~~/lib/auth/composables/onboarding'

const { finishOnboarding } = useProcessOnboarding()

const onboardingState = ref<OnboardingState>({ industry: undefined, role: undefined })

const viewer = inject<Viewer>('viewer') as Viewer

const { activeUser } = useActiveUser()
const step = ref(0)
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
  viewer.setView({ azimuth: (Math.PI / 12) * flip * factor, polar: 0 }, true)
  viewer.cameraHandler.controls.truck(factor * flip, factor * flip, true)
  flip *= -1
}

function setIndustry(val: OnboardingIndustry) {
  onboardingState.value.industry = val
  step.value++
  nextView()
}

async function setRole(val: OnboardingRole) {
  onboardingState.value.role = val
  step.value++
  nextView()
  if (activeUser.value?.id) await finishOnboarding(onboardingState.value, false)
}

function nextView() {
  viewer.setView({
    position: new Vector3(
      camPos[step.value][0],
      camPos[step.value][2],
      camPos[step.value][2]
    ),
    target: new Vector3(
      camPos[step.value][3],
      camPos[step.value][4],
      camPos[step.value][5]
    )
  })
}
</script>
