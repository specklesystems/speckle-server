<template>
  <HeaderWithEmptyPage empty-header show-logo :logo-link="false">
    <template #header-actions>
      <FormButton size="sm" color="outline" @click="onCancelClick">Cancel</FormButton>
    </template>

    <WorkspaceWizard :workspace-id="workspaceId" />
    <WorkspaceWizardCancelDialog
      v-model:open="isCancelDialogOpen"
      :workspace-id="workspaceId"
    />
  </HeaderWithEmptyPage>
</template>

<script setup lang="ts">
import { workspacesRoute } from '~~/lib/common/helpers/route'
import { WizardSteps } from '~/lib/workspaces/helpers/types'
import { useWorkspacesWizard } from '~/lib/workspaces/composables/wizard'
import { useMixpanel } from '~/lib/core/composables/mp'

defineProps<{
  workspaceId?: string
}>()

const { currentStep, resetWizardState } = useWorkspacesWizard()
const mixpanel = useMixpanel()

const isCancelDialogOpen = ref(false)

const isFirstStep = computed(() => currentStep.value === WizardSteps.Details)

const onCancelClick = () => {
  if (isFirstStep.value) {
    navigateTo(workspacesRoute)
    resetWizardState()
    mixpanel.stop_session_recording()
  } else {
    isCancelDialogOpen.value = true
  }
}
</script>
