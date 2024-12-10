import type {
  WorkspaceInviteCreateInput,
  Workspace
} from '~/lib/common/generated/gql/graphql'
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

const emptyState: WorkspaceWizardState = {
  name: '',
  slug: '',
  invites: ['', '', ''],
  plan: null,
  billingInterval: BillingInterval.Monthly,
  id: '',
  region: null
}

const steps: readonly WizardSteps[] = [
  WizardSteps.Details,
  WizardSteps.Invites,
  WizardSteps.Pricing,
  WizardSteps.Region
] as const

export const useWorkspaceWizardState = () =>
  useState<{
    isLoading: boolean
    currentStepIndex: number
    currentStep: WizardSteps
    state: WorkspaceWizardState
  }>('workspace-wizard-state', () => ({
    isLoading: false,
    currentStepIndex: 0,
    currentStep: steps[0],
    state: { ...emptyState }
  }))

export const useWorkspacesWizard = () => {
  const wizardState = useWorkspaceWizardState()
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

  const isLoading = computed({
    get: () => wizardState.value.isLoading,
    set: (newVal) => (wizardState.value.isLoading = newVal)
  })

  const currentStep = computed({
    get: () => wizardState.value.currentStep,
    set: (newVal) => (wizardState.value.currentStep = newVal)
  })

  const state = computed({
    get: () => wizardState.value.state,
    set: (newVal) =>
      (wizardState.value.state = {
        ...newVal,
        invites: [...(newVal.invites || []), '', '', ''].slice(
          0,
          Math.max(3, newVal.invites?.length || 0)
        )
      })
  })

  const goToNextStep = () => {
    const shouldComplete =
      wizardState.value.currentStepIndex === steps.length - 1 ||
      (wizardState.value.currentStep === WizardSteps.Pricing &&
        wizardState.value.state.plan !== PaidWorkspacePlans.Business)

    if (!shouldComplete) {
      wizardState.value.currentStepIndex++
      wizardState.value.currentStep = steps[wizardState.value.currentStepIndex]
    }
    return shouldComplete ? completeWizard() : undefined
  }

  const goToPreviousStep = () => {
    if (wizardState.value.currentStepIndex > 0) {
      wizardState.value.currentStepIndex--
      wizardState.value.currentStep = steps[wizardState.value.currentStepIndex]
    }
  }

  const goToStep = (step: WizardSteps) => {
    const stepIndex = steps.indexOf(step)
    if (stepIndex !== -1) {
      wizardState.value.currentStepIndex = stepIndex
      wizardState.value.currentStep = steps[stepIndex]
    }
  }

  const completeWizard = async () => {
    wizardState.value.isLoading = true

    const needsCheckout =
      wizardState.value.state.plan !== PaidWorkspacePlans.Starter ||
      wizardState.value.state.billingInterval === BillingInterval.Yearly
    const workspaceId = ref(wizardState.value.state.id)
    const isNewWorkspace = !workspaceId.value

    if (isNewWorkspace) {
      const newWorkspaceResult = await createWorkspace(
        {
          name: wizardState.value.state.name,
          slug: wizardState.value.state.slug,
          defaultLogoIndex: generateDefaultLogoIndex()
        },
        { navigateOnSuccess: false, hideNotifications: true }
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
          ...wizardState.value.state,
          invites: wizardState.value.state.invites.filter((invite) => !!invite),
          region:
            wizardState.value.state.plan === PaidWorkspacePlans.Business
              ? wizardState.value.state.region
              : null
        },
        workspaceId: workspaceId.value
      }
    }).catch(convertThrowIntoFetchResult)

    if (!updatedWorkspaceResult?.data?.workspaceMutations.updateCreationState) {
      wizardState.value.state.id = workspaceId.value
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
        plan: wizardState.value.state.plan as unknown as PaidWorkspacePlans,
        cycle: wizardState.value.state.billingInterval as BillingInterval,
        workspaceId: workspaceId.value,
        isCreateFlow: true
      })
    } else {
      // Keep loading state for a second
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await router.push(workspaceRoute(wizardState.value.state.slug))
      await new Promise((resolve) => setTimeout(resolve, 1000))
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

    const result = await updateWorkspaceCreationState(
      {
        input: {
          state: {},
          workspaceId,
          completed: true
        }
      },
      {
        update: (cache, res) => {
          if (!res.data?.workspaceMutations) return

          cache.modify<Workspace>({
            id: getCacheId('Workspace', workspaceId),
            fields: {
              creationState: () => ({
                completed: true,
                state: {}
              })
            }
          })
        }
      }
    ).catch(convertThrowIntoFetchResult)

    if (result?.data?.workspaceMutations.updateCreationState) {
      mixpanel.track('Workspace Created', {
        plan: state.plan,
        billingInterval: state.billingInterval,
        source: 'wizard',
        fields: Object.keys(state).filter(
          (key) =>
            key !== 'id' &&
            (key !== 'invites' || (state.invites && state.invites.length > 0))
        ) as Array<keyof WorkspaceWizardState>,
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
    wizardState.value.currentStepIndex = 0
    currentStep.value = steps[0]
  }

  return {
    goToNextStep,
    goToPreviousStep,
    goToStep,
    resetWizardState,
    finalizeWizard,
    state,
    isLoading,
    currentStep
  }
}
