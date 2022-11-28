import { Ref } from 'vue'
import { Optional } from '@speckle/shared'
import { StepCoreType } from '~~/lib/common/helpers/components'
import { clamp } from 'lodash-es'

export function useStepsInternals(params: {
  modelValue: Ref<Optional<number>>
  steps: Ref<StepCoreType[]>
  emit: {
    (e: 'update:modelValue', val: number): void
  }
}) {
  const { modelValue, steps, emit } = params

  const value = computed({
    get: () => clamp(modelValue.value || 0, -1, steps.value.length),
    set: (newVal) => emit('update:modelValue', clamp(newVal, 0, steps.value.length))
  })

  const getStepDisplayValue = (step: number) => `${step + 1}`
  const isCurrentStep = (step: number) => step === value.value
  const isFinishedStep = (step: number) => step < value.value

  const switchStep = (newStep: number) => {
    value.value = newStep

    const stepObj = steps.value[value.value]
    stepObj?.onClick?.()
  }

  return {
    value,
    isCurrentStep,
    isFinishedStep,
    switchStep,
    getStepDisplayValue
  }
}
