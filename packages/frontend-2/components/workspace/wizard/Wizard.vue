<template>
  <div class="py-3 md:py-6">
    <CommonLoadingIcon
      v-if="workspaceId ? loading : false"
      class="my-10 justify-self-center"
    />
    <template v-else>
      <WorkspaceWizardStepDetails v-if="currentStep === WizardSteps.Details" />
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
const props = defineProps<{
  workspaceId?: string
}>()

const { setState, currentStep } = useWorkspacesWizard()

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
  if (result.data?.workspace.creationState?.completed === false) {
    setState()
  }
})
</script>
