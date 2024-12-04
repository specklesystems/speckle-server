import type { WorkspaceInviteCreateInput } from '~/lib/common/generated/gql/graphql'
import { BillingInterval, PaidWorkspacePlans } from '~/lib/common/generated/gql/graphql'
import { type WorkspaceWizardState, WizardSteps } from '~/lib/workspaces/helpers/types'
import {
  useCreateWorkspace,
  useInviteUserToWorkspace
} from '~/lib/workspaces/composables/management'
import { useWorkspacesAvatar } from '~/lib/workspaces/composables/avatar'
import { useBillingActions } from '~/lib/billing/composables/actions'
import {
  updateWorkspaceCreationStateMutation,
  setDefaultRegionMutation
} from '~/lib/workspaces/graphql/mutations'
import { useMutation } from '@vue/apollo-composable'
import { workspaceRoute } from '~/lib/common/helpers/route'
import { mapMainRoleToGqlWorkspaceRole } from '~/lib/workspaces/helpers/roles'
import { mapServerRoleToGqlServerRole } from '~/lib/common/helpers/roles'
import { Roles } from '@speckle/shared'
import { useMixpanel } from '~/lib/core/composables/mp'

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
  const { triggerNotification } = useGlobalToast()
  const mixpanel = useMixpanel()
  const inviteToWorkspace = useInviteUserToWorkspace()
  const { mutate: updateWorkspaceDefaultRegion } = useMutation(setDefaultRegionMutation)
  const { mutate: updateWorkspaceCreationState } = useMutation(
    updateWorkspaceCreationStateMutation
  )

  const setState = (initialState: WorkspaceWizardState) => {
    state.value = {
      ...initialState,
      invites: [...(initialState.invites || []), '', '', ''].slice(0, 3)
    }
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
    isLoading.value = true

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

      if (!newWorkspaceResult?.data?.workspaceMutations.create) {
        isLoading.value = false
        return
      }
      workspaceId.value = newWorkspaceResult.data.workspaceMutations.create.id
    }

    const updatedWorkspaceResult = await updateWorkspaceCreationState({
      input: {
        completed: false,
        state: {
          ...state.value,
          invites: state.value.invites.filter((invite) => !!invite),
          region:
            state.value.plan === PaidWorkspacePlans.Business ? state.value.region : null
        },
        workspaceId: workspaceId.value
      }
    }).catch(convertThrowIntoFetchResult)

    if (!updatedWorkspaceResult?.data?.workspaceMutations.updateCreationState) {
      state.value.id = workspaceId.value
      triggerNotification({
        title: 'Something went wrong, please try again',
        type: ToastNotificationType.Danger
      })

      isLoading.value = false
      return
    }

    if (needsCheckout) {
      // Add workspace ID to URL, in case the user comes back from Stripe
      router.replace({ query: { workspaceId: workspaceId.value } })

      mixpanel.track('Workspace Creation Checkout Session Started')

      // Go to Stripe
      await redirectToCheckout({
        plan: state.value.plan as unknown as PaidWorkspacePlans,
        cycle: state.value.billingInterval as BillingInterval,
        workspaceId: workspaceId.value,
        isCreateFlow: true
      })
    } else {
      // Keep loading state for a second
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await router.push(workspaceRoute(state.value.slug))
      isLoading.value = false
      resetWizardState()
    }
  }

  const finalizeWizard = async (state: WorkspaceWizardState, workspaceId: string) => {
    isLoading.value = true

    if (state.region?.key) {
      await updateWorkspaceDefaultRegion({
        workspaceId,
        regionKey: state.region.key
      }).catch(convertThrowIntoFetchResult)
    }

    if (state.invites.length > 0) {
      const inputs: WorkspaceInviteCreateInput[] = state.invites.map((email) => ({
        role: mapMainRoleToGqlWorkspaceRole(Roles.Workspace.Member),
        email,
        serverRole: mapServerRoleToGqlServerRole(Roles.Server.User)
      }))

      await inviteToWorkspace({ workspaceId, inputs, hideNotifications: true })

      mixpanel.track('Invite Action', {
        type: 'workspace invite',
        name: 'send',
        multiple: inputs.length !== 1,
        count: inputs.length,
        hasProject: true,
        to: 'email',
        source: 'wizard',
        // eslint-disable-next-line camelcase
        workspace_id: workspaceId
      })
    }

    const result = await updateWorkspaceCreationState({
      input: {
        state: {},
        workspaceId,
        completed: true
      }
    }).catch(convertThrowIntoFetchResult)

    if (result?.data?.workspaceMutations.updateCreationState) {
      mixpanel.track('Workspace Created', {
        plan: state.plan,
        billingInterval: state.billingInterval,
        // eslint-disable-next-line camelcase
        workspace_id: workspaceId
      })
    }

    if (
      state.plan === PaidWorkspacePlans.Starter &&
      state.billingInterval === BillingInterval.Monthly
    ) {
      triggerNotification({
        title: 'Workspace successfully created!',
        type: ToastNotificationType.Success
      })
    }

    isLoading.value = false
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
    resetWizardState,
    finalizeWizard
  }
}
