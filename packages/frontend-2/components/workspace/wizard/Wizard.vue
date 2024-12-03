<template>
  <div class="py-3 md:py-6">
    <CommonLoadingIcon
      v-if="workspaceId ? loading : false"
      class="my-10 justify-self-center"
    />
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

const { setState, currentStep, goToStep } = useWorkspacesWizard()
const route = useRoute()
const showPaymentError = ref(false)

const { loading, onResult } = useQuery(
  workspaceWizardQuery,
  () => ({
    workspaceId: props.workspaceId || ''
  }),
  () => ({
    enabled: !!props.workspaceId
  })
)

onResult((result) => {
  // If there is an existing workspace, we need to show the correct state
  const creationState = result.data?.workspace.creationState

  if (creationState?.completed === false && !!creationState?.state) {
    // TODO: Better typeguard
    const state = creationState.state as WorkspaceWizardState
    // If the users comes back from Stripe, we need to go to the last relevant step and show an error
    if ((route.query.workspaceId as string) && route.query.stage === 'checkout') {
      goToStep(
        state.plan === PaidWorkspacePlans.Business
          ? WizardSteps.Pricing
          : WizardSteps.Details
      )
      showPaymentError.value = true
    }

    setState({
      id: props.workspaceId ?? (route.query.workspaceId as string),
      name: state.name,
      slug: state.slug,
      // TODO: Can be improved
      // We need to add placeholder invites to the state, so we can show the correct number of invites in the UI
      invites: [
        ...(state.invites || []),
        ...(Array(Math.max(0, 3 - (state.invites?.length || 0))).fill({
          id: '',
          email: ''
        }) as Array<{ id: string; email: string }>)
      ],
      region: state.region,
      plan: null, // Force re-select plan
      billingInterval: null // Force re-select billing interval
    })
  }
})
</script>
