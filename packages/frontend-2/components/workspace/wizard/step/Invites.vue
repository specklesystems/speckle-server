<template>
  <WorkspaceWizardStep
    title="Invite teammates"
    description="Get the most of your workspace by inviting others."
  >
    <form class="flex flex-col gap-4 w-full md:w-96" @submit="onSubmit">
      <div class="flex flex-col gap-3 mt-4 w-full">
        <FormButton size="lg" submit full-width>
          {{ nextButtonText }}
        </FormButton>
        <FormButton color="subtle" size="lg" full-width @click.stop="goToPreviousStep">
          Back
        </FormButton>
      </div>
    </form>
  </WorkspaceWizardStep>
</template>

<script setup lang="ts">
import { useWorkspacesWizard } from '~/lib/workspaces/composables/wizard'

const { input, goToNextStep, goToPreviousStep } = useWorkspacesWizard()

const { invites } = toRefs(input.value)

const nextButtonText = computed(() => (invites.value.length > 0 ? 'Continue' : 'Skip'))

const onSubmit = () => {
  goToNextStep()
}
</script>
