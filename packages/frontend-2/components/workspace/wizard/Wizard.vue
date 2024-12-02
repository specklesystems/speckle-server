<template>
  <div class="py-3 md:py-6">
    <WorkspaceWizardStepDetails v-if="currentStep === WizardSteps.Details" />
    <WorkspaceWizardStepInvites v-else-if="currentStep === WizardSteps.Invites" />
    <WorkspaceWizardStepPricing v-else-if="currentStep === WizardSteps.Pricing" />
    <WorkspaceWizardStepRegion v-else-if="currentStep === WizardSteps.Region" />
  </div>
</template>
<script setup lang="ts">
import { useWorkspacesWizard } from '~/lib/workspaces/composables/wizard'
import { WizardSteps } from '~/lib/workspaces/helpers/types'
const { init, currentStep } = useWorkspacesWizard()

onMounted(() => {
  // Todo: Fetch workspace data if in progress
  init()
})
</script>
