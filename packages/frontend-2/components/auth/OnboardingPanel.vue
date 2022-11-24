<template>
  <div class="flex flex-col items-center">
    <LogoTextWhite class="mt-6 mb-24" />
    <CommonSteps :model-value="topStep" :steps="topSteps" class="mb-20" />
    <LayoutPanel class="max-w-3xl w-full">
      <div class="flex flex-col items-center">
        <CommonSteps v-model="bottomStep" :steps="bottomSteps" basic class="mb-11" />
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
import { OnboardingState } from '~~/lib/auth/helpers/onboarding'
import { StepType } from '~~/lib/common/helpers/components'

const topSteps: StepType[] = [{ name: 'Sign Up' }, { name: 'Set up' }]
const topStep = computed(() => 1) // read-only

const bottomSteps: StepType[] = [{ name: 'Industry' }, { name: 'Role' }]
const bottomStep = ref(0)

const state = ref<OnboardingState>({ industry: undefined, role: undefined })

watch(state, (newState, oldState) => {
  if (newState.industry !== oldState.industry) {
    bottomStep.value = 1
  } else if (newState.role !== oldState.role) {
    finish()
  }
})

const finish = () => {
  console.log('DONE!')
}
</script>
