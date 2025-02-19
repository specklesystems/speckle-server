<template>
  <div class="py-3 md:py-6">
    <CommonLoadingIcon v-if="loading" class="my-10 mx-auto" />
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
      <template v-if="isNewWizardEnabled">
        <WorkspaceWizardStepSso v-if="currentStep === WizardSteps.Sso" />
      </template>
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

// TODO: Add FF
const isNewWizardEnabled = true

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
const { goToStep, currentStep, isLoading, state } = useWorkspacesWizard()

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
  () => isLoading.value || (props.workspaceId ? queryLoading.value : false)
)
onResult((result) => {
  // If there is an existing workspace, we need to show the correct state
  const creationState = result.data?.workspace.creationState

  if (!creationState?.completed && !!creationState?.state) {
    const newState = creationState.state as WorkspaceWizardState

    state.value = {
      ...newState,
      id: props.workspaceId ?? (route.query.workspaceId as string)
    }

    // If the users comes back from Stripe, we need to go to the last relevant step and show an error
    if (route.query.workspaceId as string) {
      goToStep(
        newState.plan === PaidWorkspacePlans.Business
          ? WizardSteps.Region
          : WizardSteps.Pricing
      )

      if (route.query.payment_status === 'canceled' && props.workspaceId) {
        showPaymentError.value = true
        cancelCheckoutSession(route.query.session_id as string, props.workspaceId)
      }

      mixpanel.track('Workspace Creation Checkout Session Canceled')
    }
  }
})

onMounted(() => {
  mixpanel.start_session_recording()
})

watch(currentStep, (newStep, oldStep) => {
  if (newStep !== oldStep && showPaymentError.value) {
    showPaymentError.value = false
  }
})
</script>
