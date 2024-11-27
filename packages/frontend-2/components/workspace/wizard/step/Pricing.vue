<template>
  <WorkspaceWizardStep title="Which plan would you like?">
    <div class="max-w-5xl w-full">
      <div class="flex flex-col gap-3 mt-4 items-center">
        <FormButton size="lg" @click="onSubmit">
          {{ nextButtonText }}
        </FormButton>
        <FormButton color="subtle" size="lg" @click.stop="goToPreviousStep">
          Back
        </FormButton>
      </div>
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
