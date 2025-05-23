import { LogicError } from '@speckle/ui-components'

export type DialogStep<ID extends string = string> = {
  id: ID
  title: string
  /**
   * If set to true, the step will be skipped and user will be sent to next step instead
   */
  skippable?: boolean
}

export const useMultiStepDialog = <ID extends string = string>(params: {
  steps: MaybeRef<Array<DialogStep<ID>>>
  resolveNextStep?: (params: { currentStep: DialogStep<ID> }) => ID
  resolvePreviousStep?: (params: { currentStep: DialogStep<ID> }) => ID
}) => {
  const steps = computed(() => unref(params.steps).filter((s) => !s.skippable))

  const stepId = ref<ID>(steps.value[0]!.id)
  const step = computed(() => {
    const currentStep = steps.value.find((s) => s.id === stepId.value)
    if (!currentStep) {
      throw new LogicError('Invalid steps array or stepId provided')
    }

    return currentStep
  })

  const nextOrderedStep = computed(() => {
    const currentIndex = steps.value.findIndex((s) => s.id === stepId.value)
    if (currentIndex === -1) {
      return undefined
    }

    const nextStep = steps.value[currentIndex + 1]
    if (nextStep?.id === stepId.value) {
      return undefined
    }

    return nextStep
  })

  const previousOrderedStep = computed(() => {
    const currentIndex = steps.value.findIndex((s) => s.id === stepId.value)
    if (currentIndex === -1) {
      return undefined
    }

    const previousStep = steps.value[currentIndex - 1]
    if (previousStep?.id === stepId.value) {
      return undefined
    }

    return previousStep
  })

  const nextStep = computed(() => {
    if (params.resolveNextStep) {
      const nextStepId = params.resolveNextStep({ currentStep: step.value })
      const nextStep = steps.value.find((s) => s.id === nextStepId)
      if (nextStep?.id === stepId.value) {
        return undefined
      }

      return nextStep
    } else {
      return nextOrderedStep.value
    }
  })

  const previousStep = computed(() => {
    if (params.resolvePreviousStep) {
      const previousStepId = params.resolvePreviousStep({ currentStep: step.value })
      const previousStep = steps.value.find((s) => s.id === previousStepId)
      if (previousStep?.id === stepId.value) {
        return undefined
      }
      return previousStep
    } else {
      return previousOrderedStep.value
    }
  })

  const walkToAdjacentStep = (forward: boolean) => {
    const adjacentStep = forward ? nextOrderedStep.value : previousOrderedStep.value
    if (adjacentStep) {
      stepId.value = adjacentStep.id
    }
  }

  const goToNextOrderedStep = () => walkToAdjacentStep(true)
  const goToPreviousOrderedStep = () => walkToAdjacentStep(false)
  const goToStep = (id: ID) => {
    const stepIndex = steps.value.findIndex((s) => s.id === id)
    if (stepIndex === -1) {
      return
    }

    stepId.value = steps.value[stepIndex].id
  }
  const goToNextStep = () => {
    const nextStepId = nextStep.value?.id
    if (nextStepId) {
      goToStep(nextStepId)
    }
  }

  const goToPreviousStep = () => {
    const previousStepId = previousStep.value?.id
    if (previousStepId) {
      goToStep(previousStepId)
    }
  }

  const resetStep = () => {
    if (params.resolveNextStep) return goToNextStep()
    stepId.value = steps.value[0]!.id
  }

  return {
    stepId,
    step,
    nextStep,
    previousStep,
    nextOrderedStep,
    previousOrderedStep,
    goToNextOrderedStep,
    goToPreviousOrderedStep,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    resetStep
  }
}
