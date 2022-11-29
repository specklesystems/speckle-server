import { Ref } from 'vue'
import { Optional } from '@speckle/shared'
import { HorizontalOrVertical, StepCoreType } from '~~/lib/common/helpers/components'
import { clamp } from 'lodash-es'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'

export function useStepsInternals(params: {
  modelValue: Ref<Optional<number>>
  steps: Ref<StepCoreType[]>
  orientation: Ref<Optional<HorizontalOrVertical>>
  goVerticalBelow: Ref<Optional<TailwindBreakpoints>>
  emit: {
    (e: 'update:modelValue', val: number): void
  }
}) {
  const { modelValue, steps, orientation, goVerticalBelow, emit } = params

  const finalOrientation = computed(
    (): HorizontalOrVertical =>
      orientation.value === 'vertical' ? 'vertical' : 'horizontal'
  )

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

  const listClasses = computed(() => {
    const classParts: string[] = ['flex']

    classParts.push('flex')
    if (finalOrientation.value === 'vertical' || goVerticalBelow.value) {
      classParts.push('flex-col space-y-4 justify-center')

      if (goVerticalBelow.value === TailwindBreakpoints.sm) {
        classParts.push(
          'sm:flex-row sm:space-y-0 sm:justify-start sm:space-x-8 sm:items-center'
        )
      } else if (goVerticalBelow.value === TailwindBreakpoints.md) {
        classParts.push(
          'md:flex-row md:space-y-0 md:justify-start md:space-x-8 md:items-center'
        )
      } else if (goVerticalBelow.value === TailwindBreakpoints.lg) {
        classParts.push(
          'lg:flex-row lg:space-y-0 lg:justify-start lg:space-x-8 lg:items-center'
        )
      } else if (goVerticalBelow.value === TailwindBreakpoints.xl) {
        classParts.push(
          'xl:flex-row xl:space-y-0 xl:justify-start xl:space-x-8 xl:items-center'
        )
      }
    } else {
      classParts.push('flex-row space-x-8 items-center')
    }

    return classParts.join(' ')
  })

  return {
    value,
    isCurrentStep,
    isFinishedStep,
    switchStep,
    getStepDisplayValue,
    listClasses,
    orientation: finalOrientation
  }
}
