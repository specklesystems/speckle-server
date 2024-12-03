import { nanoid } from 'nanoid'
import { BillingInterval, PaidWorkspacePlans } from '~/lib/common/generated/gql/graphql'
import { type WorkspaceWizardState, WizardSteps } from '~/lib/workspaces/helpers/types'
import { useCreateWorkspace } from '~/lib/workspaces/composables/management'
import { useWorkspacesAvatar } from '~/lib/workspaces/composables/avatar'
import { useBillingActions } from '~/lib/billing/composables/actions'
import { workspaceWizardUpdateWorkspaceMutation } from '~/lib/workspaces/graphql/mutations'
import { useApolloClient } from '@vue/apollo-composable'
import { workspaceRoute } from '~/lib/common/helpers/route'

const state = ref<WorkspaceWizardState>({
  name: '',
  slug: '',
  invites: [
    { id: nanoid(), email: '' },
    { id: nanoid(), email: '' },
    { id: nanoid(), email: '' }
  ],
  plan: null,
  billingInterval: BillingInterval.Monthly,
  id: null
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
    const index = Number(
      Object.keys(stepComponents.value).find(
        (key) => stepComponents.value[Number(key)] === step
      )
    )
    if (!isNaN(index)) currentStepIndex.value = index
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
        return
      } else {
        newWorkspaceId = newWorkspaceResult.data.workspaceMutations.create.id
      }
    }

    // Update the workspace state to completed
    const updateWorkspaceResult = await apollo
      .mutate({
        mutation: workspaceWizardUpdateWorkspaceMutation,
        variables: {
          input: {
            completed: !needsCheckout,
            state: {
              ...state.value,
              // Remove placeholder invites
              invites: state.value.invites.filter((invite) => !!invite.email)
            },
            workspaceId: state.value.id ?? newWorkspaceId
          }
        },
        update: (cache, res) => {
          if (needsCheckout) return

          const { data } = res
          if (!data?.workspaceMutations) return

          cache.modify({
            id: getCacheId('Workspace', state.value.id ?? newWorkspaceId),
            fields: {
              creationState: () => {
                return {
                  completed: true
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
        router.push(workspaceRoute(state.value.slug))
      }
    }
  }

  return {
    state,
    currentStep,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    setState
  }
}
