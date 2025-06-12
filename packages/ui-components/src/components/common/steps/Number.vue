<template>
  <nav class="flex justify-center" :aria-label="ariaLabel || 'Progress steps'">
    <ol :class="listClasses">
      <li v-for="(step, i) in steps" :key="step.name">
        <a
          v-if="isFinishedStep(i)"
          :href="step.href"
          :class="linkClasses"
          @click="(e) => switchStep(i, e)"
        >
          <div class="flex space-x-2 items-center">
            <div
              class="shrink-0 h-7 w-7 rounded-full border border-primary text-white bg-primary inline-flex items-center justify-center select-none"
            >
              <CheckIcon class="w-4 h-4" />
            </div>
            <div class="flex flex-col">
              <div class="text-body-xs font-medium text-primary">{{ step.name }}</div>
              <div v-if="step.description" class="text-body-2xs text-foreground-2">
                {{ step.description }}
              </div>
            </div>
          </div>
        </a>
        <a
          v-else-if="isCurrentStep(i)"
          :href="step.href"
          :class="linkClasses"
          aria-current="step"
          @click="(e) => switchStep(i, e)"
        >
          <div class="flex space-x-2 items-center">
            <div
              class="shrink-0 h-7 w-7 text-body-xs rounded-full border border-primary inline-flex items-center justify-center select-none text-primary"
            >
              {{ getStepDisplayValue(i) }}
            </div>
            <div class="flex flex-col">
              <div class="text-body-xs font-medium text-primary">{{ step.name }}</div>
              <div v-if="step.description" class="text-body-2xs text-foreground-2">
                {{ step.description }}
              </div>
            </div>
          </div>
        </a>
        <a
          v-else
          :href="step.href"
          :class="linkClasses"
          @click="(e) => switchStep(i, e)"
        >
          <div class="flex space-x-2 items-center">
            <div
              class="shrink-0 h-7 w-7 rounded-full border border-foreground-3 inline-flex items-center justify-center select-none text-foreground-3"
            >
              {{ getStepDisplayValue(i) }}
            </div>
            <div class="flex flex-col">
              <div class="text-body-xs font-medium text-foreground-2">
                {{ step.name }}
              </div>
              <div v-if="step.description" class="text-body-2xs text-foreground-2">
                {{ step.description }}
              </div>
            </div>
          </div>
        </a>
      </li>
    </ol>
  </nav>
</template>
<script setup lang="ts">
import { CheckIcon } from '@heroicons/vue/20/solid'
import { toRefs } from 'vue'
import { useStepsInternals } from '~~/src/composables/common/steps'
import type { StepsPadding } from '~~/src/composables/common/steps'
import type {
  HorizontalOrVertical,
  NumberStepType
} from '~~/src/helpers/common/components'
import { TailwindBreakpoints } from '~~/src/helpers/tailwind'

const emit = defineEmits<{
  (e: 'update:modelValue', val: number): void
}>()

const props = defineProps<{
  ariaLabel?: string
  orientation?: HorizontalOrVertical
  steps: NumberStepType[]
  modelValue?: number
  goVerticalBelow?: TailwindBreakpoints
  nonInteractive?: boolean
  stepsPadding?: StepsPadding
}>()

const {
  isCurrentStep,
  isFinishedStep,
  switchStep,
  getStepDisplayValue,
  listClasses,
  linkClasses
} = useStepsInternals({
  props: toRefs(props),
  emit
})
</script>
