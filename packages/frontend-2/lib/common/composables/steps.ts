import { ToRefs } from 'vue'
import { HorizontalOrVertical, StepCoreType } from '~~/lib/common/helpers/components'
import { clamp } from 'lodash-es'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'

export function useStepsInternals(params: {
  props: ToRefs<{
    orientation?: HorizontalOrVertical
    steps: StepCoreType[]
    modelValue?: number
    goVerticalBelow?: TailwindBreakpoints
    nonInteractive?: boolean
  }>
  emit: {
    (e: 'update:modelValue', val: number): void
  }
}) {
  const {
    props: { modelValue, steps, orientation, goVerticalBelow, nonInteractive },
    emit
  } = params

  const finalOrientation = computed(
    (): HorizontalOrVertical =>
      orientation?.value === 'vertical' ? 'vertical' : 'horizontal'
  )

  const value = computed({
    get: () => clamp(modelValue?.value || 0, -1, steps.value.length),
    set: (newVal) => emit('update:modelValue', clamp(newVal, 0, steps.value.length))
  })

  const getStepDisplayValue = (step: number) => `${step + 1}`
  const isCurrentStep = (step: number) => step === value.value
  const isFinishedStep = (step: number) => step < value.value

  const switchStep = (newStep: number, e?: MouseEvent) => {
    if (nonInteractive?.value) {
      e?.preventDefault()
      e?.stopPropagation()
      e?.stopImmediatePropagation()
      return
    }

    value.value = newStep

    const stepObj = steps.value[value.value]
    stepObj?.onClick?.()
  }

  const listClasses = computed(() => {
    const classParts: string[] = ['flex']

    classParts.push('flex')
    if (finalOrientation.value === 'vertical' || goVerticalBelow?.value) {
      classParts.push('flex-col space-y-4 justify-center')

      if (goVerticalBelow?.value === TailwindBreakpoints.sm) {
        classParts.push(
          'sm:flex-row sm:space-y-0 sm:justify-start sm:space-x-8 sm:items-center'
        )
      } else if (goVerticalBelow?.value === TailwindBreakpoints.md) {
        classParts.push(
          'md:flex-row md:space-y-0 md:justify-start md:space-x-8 md:items-center'
        )
      } else if (goVerticalBelow?.value === TailwindBreakpoints.lg) {
        classParts.push(
          'lg:flex-row lg:space-y-0 lg:justify-start lg:space-x-8 lg:items-center'
        )
      } else if (goVerticalBelow?.value === TailwindBreakpoints.xl) {
        classParts.push(
          'xl:flex-row xl:space-y-0 xl:justify-start xl:space-x-8 xl:items-center'
        )
      }
    } else {
      classParts.push('flex-row space-x-8 items-center')
    }

    return classParts.join(' ')
  })

  const linkClasses = computed(() => {
    const classParts: string[] = ['flex items-center']

    if (!nonInteractive?.value) {
      classParts.push('cursor-pointer')
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
    linkClasses,
    orientation: finalOrientation
  }
}
