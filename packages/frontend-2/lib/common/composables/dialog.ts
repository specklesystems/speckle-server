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

  const walkToAdjacentStep = (forward: boolean) => {
    const currentIndex = steps.value.findIndex((s) => s.id === stepId.value)
    if (currentIndex === -1) {
      return
    }

    const nextIndex = forward ? currentIndex + 1 : currentIndex - 1
    if (nextIndex >= 0 && nextIndex < steps.value.length) {
      stepId.value = steps.value[nextIndex].id
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
    if (params.resolveNextStep) {
      const nextStepId = params.resolveNextStep({ currentStep: step.value })
      goToStep(nextStepId)
    } else {
      goToNextOrderedStep()
    }
  }
  const goToPreviousStep = () => {
    if (params.resolvePreviousStep) {
      const previousStepId = params.resolvePreviousStep({ currentStep: step.value })
      goToStep(previousStepId)
    } else {
      goToPreviousOrderedStep()
    }
  }

  const resetStep = () => {
    if (params.resolveNextStep) return goToNextStep()
    stepId.value = steps.value[0]!.id
  }

  return {
    stepId,
    step,
    goToNextOrderedStep,
    goToPreviousOrderedStep,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    resetStep
  }
}
