import WorkspaceWizardStepDetails from '@/components/workspace/wizard/step/Details.vue'
import WorkspaceWizardStepInvites from '@/components/workspace/wizard/step/Invites.vue'
import WorkspaceWizardStepPricing from '@/components/workspace/wizard/step/Pricing.vue'
import WorkspaceWizardStepRegion from '@/components/workspace/wizard/step/Region.vue'

import type {
  BillingInterval,
  PaidWorkspacePlans
} from '~/lib/common/generated/gql/graphql'

const input = ref<{
  name: string
  slug: string
  invites: string[]
  plan: PaidWorkspacePlans | null
  billingInterval: BillingInterval | null
}>({
  name: '',
  slug: '',
  invites: [],
  plan: null,
  billingInterval: null
})

const currentStepIndex = ref(0)
const stepComponents = ref<Record<number, Component>>({
  0: WorkspaceWizardStepDetails,
  1: WorkspaceWizardStepInvites,
  2: WorkspaceWizardStepPricing,
  3: WorkspaceWizardStepRegion
})

const currentStepComponent = computed(
  () => stepComponents.value[currentStepIndex.value]
)

export const useWorkspacesWizard = () => {
  const goToNextStep = () => {
    if (currentStepIndex.value === Object.keys(stepComponents.value).length - 1) return
    currentStepIndex.value++
  }

  const goToPreviousStep = () => {
    if (currentStepIndex.value === 0) return
    currentStepIndex.value--
  }

  return {
    input,
    currentStepComponent,
    goToNextStep,
    goToPreviousStep
  }
}
