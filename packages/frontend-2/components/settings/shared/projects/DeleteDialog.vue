<template>
  <LayoutDialog v-model:open="isOpen" max-width="sm" :buttons="dialogButtons">
    <template #header>Delete project</template>
    <div class="flex flex-col gap-6 text-body-xs text-foreground">
      <p>
        Are you sure you want to
        <span class="font-medium">permanently delete</span>
        the selected project?
      </p>
      <div
        v-if="project"
        class="rounded border bg-foundation-2 border-outline-3 text-body-2xs py-3 px-4"
      >
        <p class="font-medium">{{ project.name }}</p>
        <p>
          {{ project.models.totalCount }} models,
          {{ project.versions.totalCount }} versions
        </p>
      </div>
      <p>
        This action
        <span class="font-medium">cannot</span>
        be undone.
      </p>
      <p>To confirm deletion, type the project name below.</p>
      <FormTextInput
        v-model="projectNameInput"
        name="projectNameConfirm"
        label="Project name"
        size="lg"
        placeholder="Type the project name here..."
        full-width
        hide-error-message
        class="text-sm"
        color="foundation"
      />
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { LayoutDialog, type LayoutDialogButton } from '@speckle/ui-components'
import type { ProjectItem } from '~~/lib/server-management/helpers/types'
import { useDeleteProject } from '~~/lib/projects/composables/projectManagement'
import { useMixpanel } from '~~/lib/core/composables/mp'

const props = defineProps<{
  open: boolean
  project: ProjectItem
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const projectNameInput = ref('')
const deleteProject = useDeleteProject()
const mp = useMixpanel()

const dialogButtons = computed<LayoutDialogButton[]>(() => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
      projectNameInput.value = ''
    }
  },
  {
    text: 'Delete',
    props: {
      color: 'danger',

      disabled: projectNameInput.value !== props.project.name
    },
    onClick: async () => {
      await deleteProject(props.project.id)
      isOpen.value = false
      mp.track('Stream Action', { type: 'action', name: 'delete' })
    }
  }
])
</script>
