<template>
  <WorkspaceWizardStep
    title="Set your data location"
    description="Manage where your new workspace data resides."
  >
    <form class="flex flex-col gap-4 w-full md:w-96 pt-8" @submit="onSubmit">
      <FormButton size="lg" full-width submit>Continue</FormButton>
      <FormButton color="subtle" size="lg" full-width @click.stop="goToPreviousStep">
        Back
      </FormButton>
    </form>
  </WorkspaceWizardStep>
</template>

<script setup lang="ts">
import { useWorkspacesWizard } from '~/lib/workspaces/composables/wizard'

const { goToNextStep, goToPreviousStep } = useWorkspacesWizard()

const onSubmit = () => {
  goToNextStep()
}
</script>
