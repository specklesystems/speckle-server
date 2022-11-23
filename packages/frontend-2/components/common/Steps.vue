<template>
  <nav class="flex justify-center" :aria-label="ariaLabel || 'Progress steps'">
    <ol :class="listClasses">
      <li v-for="(step, i) in steps" :key="step.name">
        <a
          v-if="isFinishedStep(i)"
          :href="step.href"
          :class="linkClasses"
          @click="() => switchStep(i)"
        >
          <span class="relative flex h-5 w-5 flex-shrink-0 items-center justify-center">
            <CheckCircleIcon class="h-full w-full text-primary" aria-hidden="true" />
          </span>
          <span class="ml-3 text-foreground h6">
            {{ step.name }}
          </span>
        </a>
        <a
          v-else-if="isCurrentStep(i)"
          :href="step.href"
          :class="linkClasses"
          aria-current="step"
          @click="() => switchStep(i)"
        >
          <span
            class="relative flex h-5 w-5 flex-shrink-0 items-center justify-center"
            aria-hidden="true"
          >
            <span class="absolute h-4 w-4 rounded-full bg-primary-outline-2" />
            <span class="relative block h-2 w-2 rounded-full bg-primary-focus" />
          </span>
          <span class="ml-3 text-primary-focus h6">
            {{ step.name }}
          </span>
        </a>
        <a v-else :href="step.href" :class="linkClasses" @click="() => switchStep(i)">
          <div
            class="relative flex h-5 w-5 flex-shrink-0 items-center justify-center"
            aria-hidden="true"
          >
            <div class="h-2 w-2 rounded-full bg-foreground-2" />
          </div>
          <p class="ml-3 text-foreground h6">
            {{ step.name }}
          </p>
        </a>
      </li>
    </ol>
  </nav>
</template>
<script setup lang="ts">
import { CheckCircleIcon } from '@heroicons/vue/20/solid'
import { clamp } from 'lodash-es'
import { StepType } from '~~/lib/common/helpers/components'

type HorizontalOrVertical = 'horizontal' | 'vertical'

const emit = defineEmits<{
  (e: 'update:modelValue', val: number): void
}>()

const props = defineProps<{
  ariaLabel?: string
  basic?: boolean
  orientation?: HorizontalOrVertical
  steps: StepType[]
  modelValue?: number
}>()

const linkClasses = ref('flex items-center cursor-pointer')

const orientation = computed(
  (): HorizontalOrVertical =>
    props.orientation === 'vertical' ? 'vertical' : 'horizontal'
)
const listClasses = computed(() =>
  orientation.value === 'vertical'
    ? 'flex flex-col space-y-4 justify-center'
    : 'flex space-x-8 items-center'
)

const value = computed({
  get: () => props.modelValue || 0,
  set: (newVal) => emit('update:modelValue', clamp(newVal, 0, props.steps.length))
})

const isCurrentStep = (step: number) => step === value.value
const isFinishedStep = (step: number) => step < value.value

const switchStep = (newStep: number) => {
  value.value = newStep

  const stepObj = props.steps[value.value]
  if (stepObj?.onClick) {
    stepObj.onClick()
  }
}
</script>
