<template>
  <div class="py-3 md:py-6">
    <CommonLoadingIcon v-if="loading" class="my-10 justify-self-center" />
    <template v-else>
      <CommonAlert
        v-if="showPaymentError"
        color="danger"
        class="w-lg mb-6 max-w-lg mx-auto"
      >
        <template #title>
          Something went wrong with your payment. Please try again.
        </template>
      </CommonAlert>
      <WorkspaceWizardStepDetails
        v-if="currentStep === WizardSteps.Details"
        :disable-slug-edit="!!workspaceId"
      />
      <WorkspaceWizardStepInvites v-else-if="currentStep === WizardSteps.Invites" />
      <WorkspaceWizardStepPricing v-else-if="currentStep === WizardSteps.Pricing" />
      <WorkspaceWizardStepRegion v-else-if="currentStep === WizardSteps.Region" />
    </template>
  </div>
</template>
<script setup lang="ts">
import { useWorkspacesWizard } from '~/lib/workspaces/composables/wizard'
import { WizardSteps } from '~/lib/workspaces/helpers/types'
import { workspaceWizardQuery } from '~/lib/workspaces/graphql/queries'
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~~/lib/common/generated/gql'
import type { WorkspaceWizardState } from '~~/lib/workspaces/helpers/types'
import { PaidWorkspacePlans } from '~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~/lib/core/composables/mp'
import { useBillingActions } from '~/lib/billing/composables/actions'

graphql(`
  fragment WorkspaceWizard_Workspace on Workspace {
    creationState {
      completed
      state
    }
    name
    slug
  }
`)

const props = defineProps<{
  workspaceId?: string
}>()

const { cancelCheckoutSession } = useBillingActions()
const route = useRoute()
const mixpanel = useMixpanel()
const {
  setState,
  currentStep,
  goToStep,
  isLoading: wizardIsLoading
} = useWorkspacesWizard()
const { loading: queryLoading, onResult } = useQuery(
  workspaceWizardQuery,
  () => ({
    workspaceId: props.workspaceId || ''
  }),
  () => ({
    enabled: !!props.workspaceId
  })
)

const showPaymentError = ref(false)

const loading = computed(
  () => wizardIsLoading.value || (props.workspaceId ? queryLoading.value : false)
)

onResult((result) => {
  // If there is an existing workspace, we need to show the correct state
  const creationState = result.data?.workspace.creationState

  if (!creationState?.completed && !!creationState?.state) {
    const state = creationState.state as WorkspaceWizardState

    setState({
      ...state,
      id: props.workspaceId ?? (route.query.workspaceId as string),
      plan: null, // Force re-select plan
      billingInterval: null // Force re-select billing interval
    })

    // If the users comes back from Stripe, we need to go to the last relevant step and show an error
    if (route.query.workspaceId as string) {
      goToStep(
        state.plan === PaidWorkspacePlans.Business
          ? WizardSteps.Region
          : WizardSteps.Pricing
      )

      if (route.query.payment_status === 'canceled' && props.workspaceId) {
        showPaymentError.value = true
        cancelCheckoutSession(route.query.session_id as string, props.workspaceId)
      }

      mixpanel.track('Workspace Creation Checkout Session Started')
    }
  } else {
    mixpanel.track('Workspace Creation Started')
  }
})
</script>
