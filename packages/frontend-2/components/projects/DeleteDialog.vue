<template>
  <LayoutDialog v-model:open="isOpen" max-width="sm" :buttons="dialogButtons">
    <template #header>Delete project</template>
    <div class="flex flex-col gap-4 text-body-xs text-foreground">
      <div class="flex flex-col gap-2">
        <p>
          Are you sure you want to
          <span class="font-medium">permanently delete</span>
          the
          <span class="font-medium">"{{ project.name }}"</span>
          project? This action
          <span class="font-medium">cannot</span>
          be undone.
        </p>
        <CommonCard class="bg-foundation !py-4 text-body-2xs flex flex-row gap-y-2">
          <p>
            {{ modelText }}
          </p>
          <p>
            {{ versionsText }}
          </p>
        </CommonCard>
      </div>
      <div class="flex flex-col gap-2">
        <p>To confirm, type the project name below.</p>
        <FormTextInput
          v-model="projectNameInput"
          name="projectNameConfirm"
          label="Project name"
          size="lg"
          placeholder="Project name..."
          full-width
          hide-error-message
          class="text-sm"
          color="foundation"
        />
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { LayoutDialog, type LayoutDialogButton } from '@speckle/ui-components'
import { useDeleteProject } from '~~/lib/projects/composables/projectManagement'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { graphql } from '~~/lib/common/generated/gql'
import type {
  FullPermissionCheckResultFragment,
  ProjectsDeleteDialog_ProjectFragment
} from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment ProjectsDeleteDialog_Project on Project {
    id
    name
    role
    models(limit: 0) {
      totalCount
    }
    workspace {
      slug
      id
    }
    versions(limit: 0) {
      totalCount
    }
    permissions {
      canDelete {
        ...FullPermissionCheckResult
      }
    }
  }
`)

const props = defineProps<{
  open: boolean
  project: ProjectsDeleteDialog_ProjectFragment
  redirectOnComplete?: boolean
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const deleteProject = useDeleteProject()
const mixpanel = useMixpanel()

const projectNameInput = ref('')

const modelText = computed(
  () =>
    `${props.project.models.totalCount} ${
      props.project.models.totalCount === 1 ? 'model' : 'models'
    }`
)
const versionsText = computed(
  () =>
    `${props.project.versions.totalCount} ${
      props.project.versions.totalCount === 1 ? 'version' : 'versions'
    }`
)

const canDelete = computed((): FullPermissionCheckResultFragment => {
  if (projectNameInput.value !== props.project.name)
    return {
      authorized: false,
      code: 'NAME_MISMATCH',
      message: 'Entered project name does not match the actual project name'
    }

  return props.project.permissions.canDelete
})

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

      disabled: !canDelete.value.authorized
    },
    disabledMessage: canDelete.value.message,
    onClick: async () => {
      if (!canDelete.value.authorized) return

      const options = {
        goHome: props.redirectOnComplete,
        workspaceSlug: props.project.workspace?.slug
      }

      await deleteProject(props.project.id, options)
      isOpen.value = false
      mixpanel.track('Stream Action', {
        type: 'action',
        name: 'delete',
        // eslint-disable-next-line camelcase
        workspace_id: props.project.workspace?.id
      })
    }
  }
])

watch(
  () => isOpen.value,
  (newVal, oldVal) => {
    if (newVal && !oldVal) {
      projectNameInput.value = ''
    }
  }
)
</script>
