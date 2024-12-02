<template>
  <div class="py-3 md:py-6">
    <CommonLoadingIcon
      v-if="workspaceId ? loading : false"
      class="my-10 justify-self-center"
    />
    <template v-else>
      <CommonAlert color="danger">
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
  if (!result.data?.workspace.creationState?.completed) {
    if (route.query.workspaceId as string) {
      goToStep(WizardSteps.Pricing)
    }

    setState({
      name: result.data.workspace.name,
      slug: result.data.workspace.slug,
      invites: [],
      plan: null,
      billingInterval: null
    })
  }
})
</script>
