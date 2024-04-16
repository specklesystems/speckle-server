import { clamp } from 'lodash-es'

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
