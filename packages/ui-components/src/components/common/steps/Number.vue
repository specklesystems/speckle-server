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
          <div
            class="flex space-x-3 items-center text-primary normal font-medium leading-5"
          >
            <div
              class="shrink-0 h-8 w-8 rounded-full bg-primary text-foreground-on-primary inline-flex items-center justify-center select-none"
            >
              <CheckIcon class="w-5 h-5" />
            </div>
            <div class="flex flex-col">
              <div>{{ step.name }}</div>
              <div v-if="step.description" class="label label--light text-foreground">
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
          <div
            class="flex space-x-3 items-center text-primary normal font-medium leading-5"
          >
            <div
              class="shrink-0 h-8 w-8 rounded-full border-2 border-primary inline-flex items-center justify-center select-none"
            >
              {{ getStepDisplayValue(i) }}
            </div>
            <div class="flex flex-col">
              <div>{{ step.name }}</div>
              <div v-if="step.description" class="label label--light text-foreground">
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
          <div
            class="flex space-x-3 items-center text-foreground-disabled normal font-medium leading-5"
          >
            <div
              class="shrink-0 h-8 w-8 rounded-full border-2 border-foreground-disabled inline-flex items-center justify-center select-none"
            >
              {{ getStepDisplayValue(i) }}
            </div>
            <div class="flex flex-col">
              <div>{{ step.name }}</div>
              <div v-if="step.description" class="label label--light">
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
