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
        name="projectNameConfirm"
        label="Project name"
        placeholder="Type the project name here"
        full-width
        hide-error-message
        class="text-sm"
        color="foundation"
      />
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { LayoutDialog, FormTextInput } from '@speckle/ui-components'
import { useDeleteProject } from '~~/lib/projects/composables/projectManagement'
import type { ProjectSettingsQuery } from '~~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useTeamInternals } from '~~/lib/projects/composables/team'

type ProjectType = ProjectSettingsQuery['project']

const isOpen = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  project: ProjectType
}>()

const projectNameInput = ref('')

const projectData = computed(() => props.project)

const { isOwner } = useTeamInternals(projectData)

const deleteProject = useDeleteProject()
const mp = useMixpanel()

const dialogButtons = computed(() => [
  {
    text: 'Cancel',
    props: { color: 'secondary', fullWidth: true },
    onClick: () => {
      isOpen.value = false
      projectNameInput.value = ''
    }
  },
  {
    text: 'Delete',
    props: {
      color: 'danger',
      fullWidth: true,
      outline: true,
      disabled: projectNameInput.value !== props.project.name
    },
    onClick: async () => {
      if (projectNameInput.value === props.project.name && isOwner.value) {
        await deleteProject(props.project.id, { goHome: true })
        isOpen.value = false
        mp.track('Stream Action', { type: 'action', name: 'delete' })
      }
    }
  }
])
</script>
