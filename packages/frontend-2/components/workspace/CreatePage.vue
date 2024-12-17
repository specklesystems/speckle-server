<template>
  <div class="bg-foundation-page">
    <nav class="fixed z-40 top-0 h-12 bg-foundation border-b border-outline-2">
      <div class="flex items-center justify-between h-full w-screen py-4 px-3 sm:px-4">
        <HeaderLogoBlock :active="false" class="min-w-40" @click="onCancelClick" />
        <FormButton size="sm" color="outline" @click="onCancelClick">Cancel</FormButton>
      </div>
    </nav>
    <div class="h-dvh w-dvh overflow-hidden flex flex-col">
      <div class="h-12 w-full shrink-0" />
      <main class="w-full h-full overflow-y-auto simple-scrollbar pt-8 pb-16">
        <div class="container mx-auto px-6 md:px-12">
          <WorkspaceWizard :workspace-id="workspaceId" />

          <WorkspaceWizardCancelDialog
            v-model:open="isCancelDialogOpen"
            :workspace-id="workspaceId"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { workspacesRoute } from '~~/lib/common/helpers/route'
import { WizardSteps } from '~/lib/workspaces/helpers/types'
import { useWorkspacesWizard } from '~/lib/workspaces/composables/wizard'

defineProps<{
  workspaceId?: string
}>()

const { currentStep } = useWorkspacesWizard()

const isCancelDialogOpen = ref(false)

const isFirstStep = computed(() => currentStep.value === WizardSteps.Details)

const onCancelClick = () => {
  if (isFirstStep.value) {
    navigateTo(workspacesRoute)
  } else {
    isCancelDialogOpen.value = true
  }
}
</script>
