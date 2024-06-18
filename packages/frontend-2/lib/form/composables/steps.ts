import type { NumberStepType } from '@speckle/ui-components'
import { clamp, isArray } from 'lodash-es'

/**
 * Provides to different ways to switch between steps wherever that is needed (e.g. in a wizard dialog).
 * step - shows the numeric order of steps, you can easily increment or decrement the number to go back
 * enumStep - shows the current step Enum value, so that you can read or switch to a specific one
 */
export const useEnumSteps = <E>(params: { order: MaybeRef<E[]> }) => {
  const { order } = params

  const coreStep = ref(0)

  const step = computed({
    get: () => coreStep.value,
    set: (newVal) => {
      coreStep.value = clamp(newVal, 0, unref(order).length - 1)
    }
  })

  const enumStep = computed({
    get: () => unref(order)[step.value] || unref(order)[0],
    set: (newVal) => {
      const index = unref(order).indexOf(newVal)
      if (index >= 0) {
        step.value = index
      }
    }
  })

  return {
    step,
    enumStep
  }
}

/**
 * Sets up a Steps Widget model, items & visibility ref based on the current Enum based step
 * and mapping between the Enum steps and the widget steps.
 *
 * This is useful whenever there isn't a 1:1 mapping between all Enum steps and Widget steps,
 * because, for example, the steps widget is only shown on some screens, not all of them
 */
export const useEnumStepsWidgetSetup = <E>(params: {
  enumStep: Ref<E>
  widgetStepsMap: MaybeRef<Array<{ step: E | E[]; title: string }>>
}) => {
  const { enumStep, widgetStepsMap } = params

  const items = computed((): NumberStepType[] =>
    unref(widgetStepsMap).map((step) => ({
      name: step.title
    }))
  )

  const model = computed({
    get: () => {
      const idx = unref(widgetStepsMap).findIndex((step) =>
        isArray(step.step)
          ? step.step.includes(enumStep.value)
          : step.step === enumStep.value
      )
      return idx === -1 ? 0 : idx
    },
    set: (newVal) => {
      const stepsWidgetStep = unref(widgetStepsMap)[newVal]
      if (stepsWidgetStep) {
        enumStep.value = isArray(stepsWidgetStep.step)
          ? stepsWidgetStep.step[0]
          : stepsWidgetStep.step
      }
    }
  })

  const shouldShowWidget = computed(
    () =>
      !!unref(widgetStepsMap).find((step) =>
        isArray(step.step)
          ? step.step.includes(enumStep.value)
          : step.step === enumStep.value
      )
  )

  return {
    items,
    model,
    shouldShowWidget
  }
}
