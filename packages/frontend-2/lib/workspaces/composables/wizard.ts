import { nanoid } from 'nanoid'
import { BillingInterval, PaidWorkspacePlans } from '~/lib/common/generated/gql/graphql'
import { type WorkspaceWizardState, WizardSteps } from '~/lib/workspaces/helpers/types'
import { useCreateWorkspace } from '~/lib/workspaces/composables/management'
import { useWorkspacesAvatar } from '~/lib/workspaces/composables/avatar'
import { useBillingActions } from '~/lib/billing/composables/actions'

const state = ref<WorkspaceWizardState>({
  name: '',
  slug: '',
  invites: [
    { id: nanoid(), email: '' },
    { id: nanoid(), email: '' },
    { id: nanoid(), email: '' }
  ],
  plan: null,
  billingInterval: BillingInterval.Monthly
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
  const createWorkspace = useCreateWorkspace()
  const { generateDefaultLogoIndex } = useWorkspacesAvatar()
  const { redirectToCheckout } = useBillingActions()
  const router = useRouter()

  const setState = (initialState: WorkspaceWizardState) => {
    state.value = initialState
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

  /**
   * This will complete the wizard and create the workspace.
   * We have to do a few things here:
   * - Create the workspace
   * - Add the ID and a param to the URL, in case the use comes back from Stripe
   * - Redirect to Stripe if the plan is paid
   */
  const completeWizard = async () => {
    // Monthly starter plan doesn't need checkout
    const needsCheckout =
      state.value.plan !== PaidWorkspacePlans.Starter &&
      state.value.billingInterval === BillingInterval.Monthly

    const newWorkspace = await createWorkspace(
      {
        name: state.value.name,
        slug: state.value.slug,
        defaultLogoIndex: generateDefaultLogoIndex() // We will get rid of this
      },
      { navigateOnSuccess: !needsCheckout, hideNotifications: needsCheckout },
      { source: 'wizard' }
    )

    if (
      newWorkspace?.data?.workspaceMutations.create &&
      !newWorkspace?.errors &&
      needsCheckout
    ) {
      // Add workspace ID to URL, in case the user comes back from Stripe
      router.replace({
        query: {
          workspaceId: newWorkspace.data.workspaceMutations.create.id
        }
      })

      // Go to Stripe
      redirectToCheckout({
        plan: state.value.plan as unknown as PaidWorkspacePlans,
        cycle: state.value.billingInterval,
        workspaceId: newWorkspace.data.workspaceMutations.create.id
      })
    }
  }

  return {
    state,
    currentStep,
    goToNextStep,
    goToPreviousStep,
    setState
  }
}
