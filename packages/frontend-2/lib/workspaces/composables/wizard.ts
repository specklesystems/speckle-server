import { nanoid } from 'nanoid'
import { PaidWorkspacePlans } from '~/lib/common/generated/gql/graphql'
import { type WorkspaceWizardState, WizardSteps } from '~/lib/workspaces/helpers/types'
import { graphql } from '~~/lib/common/generated/gql'

graphql(`
  fragment WorkspaceWizard_Workspace on Workspace {
    creationState {
      completed
      state
    }
  }
`)

const state = ref<WorkspaceWizardState>({
  name: '',
  slug: '',
  invites: [
    { id: nanoid(), email: '' },
    { id: nanoid(), email: '' },
    { id: nanoid(), email: '' }
  ],
  plan: null,
  billingInterval: null
})

const currentStepIndex = ref(0)
const stepComponents = shallowRef<Record<number, WizardSteps>>({
  0: WizardSteps.Details,
  1: WizardSteps.Invites,
  2: WizardSteps.Pricing,
  3: WizardSteps.Region
})

const currentStep = computed(() => stepComponents.value[currentStepIndex.value])

export const useWorkspacesWizard = () => {
  const setState = (initialState?: WorkspaceWizardState) => {
    if (!initialState) return
    state.value = initialState
  }

  const completeWizard = () => {
    // console.log('completeWizard')
  }

  const goToNextStep = () => {
    if (currentStep.value === WizardSteps.Region) {
      completeWizard()
    } else if (
      currentStep.value === WizardSteps.Pricing &&
      state.value.plan !== PaidWorkspacePlans.Business
    ) {
      completeWizard()
    } else {
      currentStepIndex.value++
    }
  }

  const goToPreviousStep = () => {
    if (currentStepIndex.value === 0) return
    currentStepIndex.value--
  }

  return {
    state,
    currentStep,
    goToNextStep,
    goToPreviousStep,
    setState
  }
}
