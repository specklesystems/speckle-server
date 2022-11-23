<template>
  <div class="flex flex-col items-center">
    <LogoTextWhite class="mt-6 mb-24" />
    <CommonSteps :model-value="topStep" :steps="topSteps" class="mb-20" />
    <LayoutPanel class="max-w-3xl w-full">Hello world</LayoutPanel>
  </div>
</template>
<script setup lang="ts">
import { StepType } from '~~/lib/common/helpers/components'

const topSteps: StepType[] = [{ name: 'Sign Up' }, { name: 'Set up' }]
const topStep = ref(1)
</script>
