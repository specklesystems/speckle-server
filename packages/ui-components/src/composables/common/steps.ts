import { computed } from 'vue'
import type { ToRefs } from 'vue'
import type {
  HorizontalOrVertical,
  StepCoreType
} from '~~/src/helpers/common/components'
import { clamp } from 'lodash'
import { TailwindBreakpoints, markClassesUsed } from '~~/src/helpers/tailwind'

export type StepsPadding = 'base' | 'xs' | 'sm'

export function useStepsInternals(params: {
  props: ToRefs<{
    orientation?: HorizontalOrVertical
    steps: StepCoreType[]
    modelValue?: number
    goVerticalBelow?: TailwindBreakpoints
    nonInteractive?: boolean
    stepsPadding?: StepsPadding
  }>
  emit: {
    (e: 'update:modelValue', val: number): void
  }
}) {
  const {
    props: {
      modelValue,
      steps,
      orientation,
      goVerticalBelow,
      nonInteractive,
      stepsPadding
    },
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

    let paddingHorizontal: string
    let paddingVertical: string
    if (stepsPadding?.value === 'xs') {
      paddingHorizontal = 'space-x-2'
      paddingVertical = 'space-y-1'
    } else if (stepsPadding?.value === 'sm') {
      paddingHorizontal = 'space-x-4'
      paddingVertical = 'space-y-1'
    } else {
      paddingHorizontal = 'space-x-8'
      paddingVertical = 'space-y-4'
    }

    classParts.push('flex')
    if (finalOrientation.value === 'vertical' || goVerticalBelow?.value) {
      classParts.push(`flex-col ${paddingVertical} justify-center`)

      if (goVerticalBelow?.value === TailwindBreakpoints.sm) {
        classParts.push(
          `sm:flex-row sm:space-y-0 sm:justify-start sm:${paddingHorizontal} sm:items-center`
        )
      } else if (goVerticalBelow?.value === TailwindBreakpoints.md) {
        classParts.push(
          `md:flex-row md:space-y-0 md:justify-start md:${paddingHorizontal} md:items-center`
        )
      } else if (goVerticalBelow?.value === TailwindBreakpoints.lg) {
        classParts.push(
          `lg:flex-row lg:space-y-0 lg:justify-start lg:${paddingHorizontal} lg:items-center`
        )
      } else if (goVerticalBelow?.value === TailwindBreakpoints.xl) {
        classParts.push(
          `xl:flex-row xl:space-y-0 xl:justify-start xl:${paddingHorizontal} xl:items-center`
        )
      }
    } else {
      classParts.push(`flex-row ${paddingHorizontal} items-center`)
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

// to allow for dynamic class building above:
markClassesUsed([
  'sm:space-x-8',
  'md:space-x-8',
  'lg:space-x-8',
  'xl:space-x-8',
  'sm:space-x-2',
  'md:space-x-2',
  'lg:space-x-2',
  'xl:space-x-2',
  'sm:space-x-4',
  'md:space-x-4',
  'lg:space-x-4',
  'xl:space-x-4'
])
