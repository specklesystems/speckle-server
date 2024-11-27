<template>
  <WorkspaceWizardStep title="Which plan would you like?">
    <div class="flex flex-col gap-2 mt-4">
      <FormButton size="lg" full-width @click="onSubmit">
        {{ nextButtonText }}
      </FormButton>
      <FormButton color="subtle" size="lg" full-width @click.stop="goToPreviousStep">
        Back
      </FormButton>
    </div>
  </WorkspaceWizardStep>
</template>

<script setup lang="ts">
import { useWorkspacesWizard } from '~/lib/workspaces/composables/wizard'

const { goToNextStep, goToPreviousStep } = useWorkspacesWizard()

const nextButtonText = computed(() => 'Continue')

const onSubmit = () => {
  goToNextStep()
}
</script>
