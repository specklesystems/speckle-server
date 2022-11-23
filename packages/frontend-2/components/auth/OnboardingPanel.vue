<template>
  <div class="flex flex-col items-center">
    <LogoTextWhite class="mt-6 mb-24" />
    <CommonSteps :model-value="topStep" :steps="topSteps" class="mb-20" />
    <LayoutPanel class="max-w-3xl w-full">
      <div class="relative flex justify-center">
        <CommonSteps v-model="bottomStep" :steps="bottomSteps" basic />
        <CommonTextLink
          v-if="false"
          size="sm"
          foreground-link
          class="absolute left-0 top-0"
        >
          <span class="inline-flex space-x-1.5 items-center">
            <ArrowLeftIcon class="h-5 w-5" />
            <span>Back</span>
          </span>
        </CommonTextLink>
      </div>
    </LayoutPanel>
  </div>
</template>
<script setup lang="ts">
import { ArrowLeftIcon } from '@heroicons/vue/20/solid'
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
