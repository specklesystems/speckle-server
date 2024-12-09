<template>
  <div class="bg-foundation-page">
    <nav
      class="fixed top-0 h-14 bg-foundation w-full shadow flex items-center justify-between px-2 cursor-pointer"
    >
      <HeaderLogoBlock :active="false" class="mr-0" no-link @click="onCancelClick" />
      <FormButton color="outline" @click="onCancelClick">Cancel</FormButton>
    </nav>
    <div class="h-dvh w-dvh overflow-hidden flex flex-col">
      <!-- Static Spacer to allow for absolutely positioned HeaderNavBar  -->
      <div class="h-12 w-full shrink-0" />
      <main class="w-full h-full overflow-y-auto simple-scrollbar pt-8 pb-16">
        <div class="container mx-auto px-6 md:px-12">
          <WorkspaceWizard :workspace-id="workspaceId" />
        </div>
      </main>
    </div>

    <WorkspaceWizardCancelDialog
      v-model:open="isCancelDialogOpen"
      :workspace-id="workspaceId"
    />
  </div>
</template>

<script setup lang="ts">
import { workspacesRoute } from '~~/lib/common/helpers/route'
import { WizardSteps } from '~/lib/workspaces/helpers/types'
import { useWorkspaceWizardState } from '~/lib/workspaces/composables/wizard'

defineProps<{
  workspaceId?: string
}>()

const wizardState = useWorkspaceWizardState()

const isCancelDialogOpen = ref(false)

const isFirstStep = computed(
  () => wizardState.currentStep.value === WizardSteps.Details
)

const onCancelClick = () => {
  if (isFirstStep.value) {
    navigateTo(workspacesRoute)
  } else {
    isCancelDialogOpen.value = true
  }
}
</script>
