<template>
  <WorkspaceWizardStep
    title="Set your data location"
    description="Manage where your new workspace data resides."
  >
    <form class="flex flex-col gap-4 w-full md:w-96" @submit="onSubmit">
      <SettingsWorkspacesRegionsSelect
        v-model="defaultRegion"
        show-label
        label="Default region"
        :items="availableRegions || []"
        label-position="top"
        size="lg"
      />
      <div class="flex flex-col gap-3 mt-4 w-full">
        <FormButton size="lg" full-width submit>Continue</FormButton>
        <FormButton color="subtle" size="lg" full-width @click.stop="goToPreviousStep">
          Back
        </FormButton>
      </div>
    </form>
  </WorkspaceWizardStep>
</template>

<script setup lang="ts">
import { useWorkspacesWizard } from '~/lib/workspaces/composables/wizard'

const { goToNextStep, goToPreviousStep } = useWorkspacesWizard()

// TODO: Repalce with actual data
const defaultRegion = ref({
  description: 'Hello World',
  id: 'Hello World',
  key: 'Hello World',
  name: 'Hello World'
})
const availableRegions = ref([
  {
    description: 'Hello World',
    id: 'Hello World',
    key: 'Hello World',
    name: 'Hello World'
  }
])

const onSubmit = () => {
  goToNextStep()
}
</script>
