import { BillingInterval, PaidWorkspacePlans } from '~/lib/common/generated/gql/graphql'
import { type WorkspaceWizardState, WizardSteps } from '~/lib/workspaces/helpers/types'
import { useCreateWorkspace } from '~/lib/workspaces/composables/management'
import { useWorkspacesAvatar } from '~/lib/workspaces/composables/avatar'
import { useBillingActions } from '~/lib/billing/composables/actions'
import { workspaceWizardUpdateWorkspaceMutation } from '~/lib/workspaces/graphql/mutations'
import { useMutation } from '@vue/apollo-composable'
import { workspaceRoute } from '~/lib/common/helpers/route'

const emptyState = {
  name: '',
  slug: '',
  invites: ['', '', ''],
  plan: null,
  billingInterval: BillingInterval.Monthly,
  id: '',
  region: null
}

const state = ref<WorkspaceWizardState>({ ...emptyState })

const isLoading = ref(false)
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

  const { mutate: updateWorkspace } = useMutation(
    workspaceWizardUpdateWorkspaceMutation
  )

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

  const goToStep = (step: WizardSteps) => {
    const stepIndex = Object.keys(stepComponents.value).find(
      (key: string) => stepComponents.value[Number(key)] === step
    )
    currentStepIndex.value = Number(stepIndex)
  }

  // This will complete the wizard and create the workspace.
  const completeWizard = async () => {
    const { triggerNotification } = useGlobalToast()

    // Monthly starter plan doesn't need checkout
    const needsCheckout =
      state.value.plan !== PaidWorkspacePlans.Starter ||
      state.value.billingInterval === BillingInterval.Yearly
    const workspaceId = ref(state.value.id)
    const isNewWorkspace = !workspaceId.value

    if (isNewWorkspace) {
      const newWorkspaceResult = await createWorkspace(
        {
          name: state.value.name,
          slug: state.value.slug,
          defaultLogoIndex: generateDefaultLogoIndex()
        },
        { navigateOnSuccess: false, hideNotifications: true },
        { source: 'wizard' }
      )

      if (!newWorkspaceResult?.data?.workspaceMutations.create) return
      workspaceId.value = newWorkspaceResult.data.workspaceMutations.create.id
    }

    const updateWorkspaceResult = await updateWorkspace({
      input: {
        completed: false,
        state: {
          ...state.value,
          invites: state.value.invites.filter((invite) => !!invite.email)
        },
        workspaceId: workspaceId.value
      }
    }).catch(convertThrowIntoFetchResult)

    if (!updateWorkspaceResult?.data?.workspaceMutations.updateCreationState) {
      state.value.id = workspaceId.value
      triggerNotification({
        title: 'Something went wrong, please try again',
        type: ToastNotificationType.Danger
      })
      return
    }

    if (needsCheckout) {
      // Add workspace ID to URL, in case the user comes back from Stripe
      router.replace({ query: { workspaceId: workspaceId.value } })

      // Go to Stripe
      await redirectToCheckout({
        plan: state.value.plan as unknown as PaidWorkspacePlans,
        cycle: state.value.billingInterval as BillingInterval,
        workspaceId: workspaceId.value
      })
    } else {
      resetWizardState()
      router.push(workspaceRoute(state.value.slug))
    }
  }

  const resetWizardState = () => {
    state.value = { ...emptyState }
    currentStepIndex.value = 0
  }

  return {
    state,
    currentStep,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    isLoading,
    setState,
    resetWizardState
  }
}
