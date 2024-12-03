import { nanoid } from 'nanoid'
import { BillingInterval, PaidWorkspacePlans } from '~/lib/common/generated/gql/graphql'
import { type WorkspaceWizardState, WizardSteps } from '~/lib/workspaces/helpers/types'
import { useCreateWorkspace } from '~/lib/workspaces/composables/management'
import { useWorkspacesAvatar } from '~/lib/workspaces/composables/avatar'
import { useBillingActions } from '~/lib/billing/composables/actions'
import { workspaceWizardUpdateWorkspaceMutation } from '~/lib/workspaces/graphql/mutations'
import { useApolloClient } from '@vue/apollo-composable'
import { workspaceRoute } from '~/lib/common/helpers/route'

const emptyState = {
  name: '',
  slug: '',
  invites: [
    { id: nanoid(), email: '' },
    { id: nanoid(), email: '' },
    { id: nanoid(), email: '' }
  ],
  plan: null,
  billingInterval: BillingInterval.Monthly,
  id: null,
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
  const { client: apollo } = useApolloClient()

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

  /**
   * This will complete the wizard and create the workspace.
   * We have to do a few things here:
   * - Create the workspace
   * - Add the ID and a param to the URL, in case the use comes back from Stripe
   * - Redirect to Stripe if the plan is paid
   */
  const completeWizard = async () => {
    isLoading.value = true
    // Monthly starter plan doesn't need checkout
    const needsCheckout =
      state.value.plan !== PaidWorkspacePlans.Starter ||
      state.value.billingInterval === BillingInterval.Yearly
    const isNewWorkspace = !state.value.id
    let newWorkspaceId = ''

    if (isNewWorkspace) {
      const newWorkspaceResult = await createWorkspace(
        {
          name: state.value.name,
          slug: state.value.slug,
          defaultLogoIndex: generateDefaultLogoIndex() // We will get rid of this
        },
        { navigateOnSuccess: !needsCheckout, hideNotifications: needsCheckout },
        { source: 'wizard' }
      )

      if (
        !newWorkspaceResult?.data?.workspaceMutations.create ||
        newWorkspaceResult?.errors
      ) {
        isLoading.value = false
        return
      } else {
        newWorkspaceId = newWorkspaceResult.data.workspaceMutations.create.id
      }
    }

    const updateCreationStateInput = {
      completed: !needsCheckout,
      state: {
        ...state.value,
        invites: state.value.invites.filter((invite) => !!invite.email)
      },
      workspaceId: state.value.id ?? newWorkspaceId
    }

    const updateWorkspaceResult = await apollo
      .mutate({
        mutation: workspaceWizardUpdateWorkspaceMutation,
        variables: {
          input: {
            id: state.value.id ?? newWorkspaceId
          },
          updateCreationStateInput
        },
        update: (cache, res) => {
          if (
            needsCheckout &&
            !res.data?.workspaceMutations.update &&
            !res.data?.workspaceMutations.updateCreationState
          )
            return

          cache.modify({
            id: getCacheId('Workspace', state.value.id ?? newWorkspaceId),
            fields: {
              creationState: () => updateCreationStateInput,
              plan: () => state.value.plan,
              subscription: () => {
                return {
                  billingInterval: state.value.billingInterval
                }
              }
            }
          })
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (needsCheckout) {
      // Add workspace ID to URL, in case the user comes back from Stripe
      router.replace({ query: { workspaceId: newWorkspaceId } })

      // Go to Stripe
      if (updateWorkspaceResult?.data?.workspaceMutations.updateCreationState) {
        redirectToCheckout({
          plan: state.value.plan as unknown as PaidWorkspacePlans,
          cycle: state.value.billingInterval as BillingInterval,
          workspaceId: state.value.id ?? newWorkspaceId
        })
      }
    } else {
      // Go to workspace dashboard
      if (updateWorkspaceResult?.data?.workspaceMutations.updateCreationState) {
        resetState()
        router.push(workspaceRoute(state.value.slug))
      }
    }

    isLoading.value = false
  }

  const resetState = () => {
    state.value = { ...emptyState }
  }

  return {
    state,
    currentStep,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    isLoading,
    setState,
    resetState
  }
}
