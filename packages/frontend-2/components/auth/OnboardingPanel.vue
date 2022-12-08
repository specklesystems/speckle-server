<template>
  <div class="flex flex-col items-center">
    <!-- <LogoTextWhite class="mt-6 mb-4" /> -->
    <!-- <CommonStepsBullet
      :model-value="topStep"
      :steps="topSteps"
      class="my-6 md:my-12 lg:my-16 xl:my-20"
    /> -->
    <LayoutPanel class="max-w-3xl w-full">
      <div class="flex flex-col items-center">
        <div class="w-full relative">
          <CommonStepsBullet
            v-model="bottomStep"
            :steps="bottomSteps"
            basic
            class="mb-11"
          />
          <CommonTextLink
            v-if="bottomStep === 1"
            class="absolute top-0 left-0"
            foreground-link
            size="sm"
            @click="goToFirstStep"
          >
            <div class="inline-flex items-center space-x-1.5">
              <ArrowLeftIcon class="w-4 h-4 mt-0.5" />
              <span>Back</span>
            </div>
          </CommonTextLink>
        </div>
        <AuthOnboardingIndustryStep v-if="bottomStep === 0" v-model="state" />
        <AuthOnboardingRoleStep v-if="bottomStep === 1" v-model="state" />
        <CommonTextLink
          class="mt-8 text-foreground-2"
          foreground-link
          size="sm"
          @click="finish"
        >
          Skip
        </CommonTextLink>
      </div>
    </LayoutPanel>
  </div>
</template>
<script setup lang="ts">
import { ArrowLeftIcon } from '@heroicons/vue/20/solid'
import { useProcessOnboarding } from '~~/lib/auth/composables/onboarding'
import { OnboardingState } from '~~/lib/auth/helpers/onboarding'
import { BulletStepType } from '~~/lib/common/helpers/components'

const { finishOnboarding } = useProcessOnboarding()

const topSteps: BulletStepType[] = [{ name: 'Sign Up' }, { name: 'Set up' }]
const topStep = computed(() => 1) // read-only

const bottomSteps: BulletStepType[] = [{ name: 'Industry' }, { name: 'Role' }]
const bottomStep = ref(0)

const goToFirstStep = () => (bottomStep.value = 0)
const goToSecondStep = () => (bottomStep.value = 1)

const state = ref<OnboardingState>({ industry: undefined, role: undefined })

watch(state, (newState, oldState) => {
  if (newState.industry !== oldState.industry) {
    goToSecondStep()
  } else if (newState.role !== oldState.role) {
    finish(newState)
  }
})

const finish = async (state: OnboardingState) => {
  await finishOnboarding(state)
}
</script>
