<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    :title="title"
    :buttons="dialogButtons"
  >
    <div class="flex flex-col gap-6">
      <p>
        Are you sure you want to
        <strong>permanently delete</strong>
        the selected project?
      </p>
      <div v-if="project">
        <strong>{{ project.name }}</strong>
        <p>
          {{ project.models.totalCount }} models,
          {{ project.versions.totalCount }} versions,
        </p>
      </div>
      <p>
        This action
        <strong>cannot</strong>
        be undone.
      </p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { LayoutDialog } from '@speckle/ui-components'
import { ProjectItem } from '~~/lib/server-management/helpers/types'
import { useMutation } from '@vue/apollo-composable'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import { graphql } from '~~/lib/common/generated/gql'

const adminDeleteProject = graphql(`
  mutation AdminPanelDeleteProject($ids: [String!]) {
    streamsDelete(ids: $ids)
  }
`)

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'project-deleted', val: string): void
}>()

const props = defineProps<{
  title: string
  open: boolean
  project: ProjectItem | null
}>()

const { triggerNotification } = useGlobalToast()
const { mutate: adminDeleteMutation } = useMutation(adminDeleteProject)

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

const deleteConfirmed = async () => {
  const projectId = props.project?.id
  if (!projectId) {
    return
  }

  const result = await adminDeleteMutation({
    ids: [projectId]
  }).catch(convertThrowIntoFetchResult)

  if (result?.data?.streamsDelete) {
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Project deleted',
      description: 'The project has been successfully deleted'
    })
    emit('project-deleted', projectId)
    emit('update:open', false)
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to delete project',
      description: errorMessage
    })
  }
}

const dialogButtons = [
  {
    text: 'Delete',
    props: { color: 'danger', fullWidth: true },
    onClick: deleteConfirmed
  },
  {
    text: 'Cancel',
    props: { color: 'secondary', fullWidth: true, outline: true },
    onClick: () => emit('update:open', false)
  }
]
</script>
