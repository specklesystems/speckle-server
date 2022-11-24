<template>
  <div class="flex flex-col items-center">
    <LogoTextWhite class="mt-6 mb-24" />
    <CommonSteps :model-value="topStep" :steps="topSteps" class="mb-20" />
    <LayoutPanel class="max-w-3xl w-full">
      <div class="flex flex-col items-center">
        <CommonSteps v-model="bottomStep" :steps="bottomSteps" basic class="mb-11" />
        <div class="h3 mb-8">Which industry are you in?</div>
        Ay
      </div>
    </LayoutPanel>
  </div>
</template>
<script setup lang="ts">
import { StepType } from '~~/lib/common/helpers/components'

const topSteps: StepType[] = [{ name: 'Sign Up' }, { name: 'Set up' }]
const topStep = computed(() => 1) // read-only

const bottomSteps: StepType[] = [
  { name: 'Industry' },
  { name: 'Role' },
  { name: 'Test' }
]
const bottomStep = ref(1)
</script>
