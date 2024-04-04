<template>
  <LayoutDialog v-model:open="isOpen" max-width="md" :buttons="dialogButtons">
    <template #header>Delete Project</template>
    <div class="space-y-4">
      <p class="font-bold">Deleting a project is an irreversible action.</p>
      <p>
        If you are sure you want to proceed, type in the project name
        <strong>{{ project.name }}</strong>
        in the input field below and press "Delete".
      </p>
      <FormTextInput
        v-model="projectNameInput"
        name="Delete Project"
        label="Project name"
        placeholder="Type the project name here"
        :rules="[validateProjectName]"
        hide-error-message
        color="foundation"
        size="lg"
        outlined
        dense
      />
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { LayoutDialog, FormTextInput } from '@speckle/ui-components'
import { useDeleteProject } from '~~/lib/projects/composables/projectManagement'
import type { ProjectSettingsGeneralQuery } from '~~/lib/common/generated/gql/graphql'
type ProjectType = ProjectSettingsGeneralQuery['project']

const isOpen = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  project: ProjectType
}>()

const projectNameInput = ref('')

const deleteProject = useDeleteProject()

const validateProjectName = (value: string) =>
  value === props.project.name || 'The project name does not match.'

const dialogButtons = computed(() => [
  {
    text: 'Cancel',
    props: { color: 'secondary', fullWidth: true },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Delete',
    props: {
      color: 'danger',
      fullWidth: true,
      outline: true,
      submit: true,
      disabled: projectNameInput.value !== props.project.name
    },
    onClick: async () => {
      if (projectNameInput.value === props.project.name) {
        await deleteProject(props.project.id, { goHome: true })
        isOpen.value = false // Close dialog upon successful deletion
      }
    }
  }
])
</script>
