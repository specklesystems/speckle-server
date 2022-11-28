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
          <div
            class="flex space-x-3 items-center text-primary-focus normal font-medium leading-5"
          >
            <div
              class="h-8 w-8 rounded-full bg-primary-focus text-foreground-on-primary inline-flex items-center justify-center"
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
          @click="() => switchStep(i)"
        >
          <div
            class="flex space-x-3 items-center text-primary-focus normal font-medium leading-5"
          >
            <div
              class="h-8 w-8 rounded-full border-2 border-primary-focus inline-flex items-center justify-center"
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
        <a v-else :href="step.href" :class="linkClasses" @click="() => switchStep(i)">
          <div
            class="flex space-x-3 items-center text-foreground-disabled normal font-medium leading-5"
          >
            <div
              class="h-8 w-8 rounded-full border-2 border-foreground-disabled inline-flex items-center justify-center"
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
import { useStepsInternals } from '~~/lib/common/composables/steps'
import { NumberStepType } from '~~/lib/common/helpers/components'

type HorizontalOrVertical = 'horizontal' | 'vertical'

const emit = defineEmits<{
  (e: 'update:modelValue', val: number): void
}>()

const props = defineProps<{
  ariaLabel?: string
  orientation?: HorizontalOrVertical
  steps: NumberStepType[]
  modelValue?: number
}>()

const { isCurrentStep, isFinishedStep, switchStep, getStepDisplayValue } =
  useStepsInternals({
    modelValue: toRef(props, 'modelValue'),
    steps: toRef(props, 'steps'),
    emit
  })

const linkClasses = ref('flex items-center cursor-pointer')

const orientation = computed(
  (): HorizontalOrVertical =>
    props.orientation === 'vertical' ? 'vertical' : 'horizontal'
)
const listClasses = computed(() => {
  const classParts: string[] = ['flex']

  if (orientation.value === 'vertical') {
    classParts.push('flex flex-col space-y-4 justify-center')
  } else {
    classParts.push('flex items-center')
    classParts.push('space-x-8')
  }

  return classParts.join(' ')
})
</script>
