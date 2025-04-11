<template>
  <LayoutDialog
    v-model:open="open"
    max-width="sm"
    :title="dialogTitle"
    :buttons="dialogButtons"
  >
    <!-- Project Selection -->
    <WorkspaceMoveProjectSelectProject
      v-if="!selectedProject"
      @project-selected="onProjectSelected"
    />

    <!-- Workspace Selection -->
    <WorkspaceMoveProjectSelectWorkspace
      v-if="selectedProject && activeDialog === 'workspace'"
      :project="selectedProject"
      @workspace-selected="onWorkspaceSelected"
    />

    <!-- Confirmation -->
    <WorkspaceMoveProjectConfirm
      v-if="selectedProject && selectedWorkspace && activeDialog === 'confirmation'"
      :project="selectedProject"
      :workspace="selectedWorkspace"
      @move-complete="onMoveComplete"
    />
  </LayoutDialog>
</template>

<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import type {
  WorkspaceMoveProjectSelectProject_ProjectFragment,
  WorkspaceMoveProjectSelectWorkspace_WorkspaceFragment
} from '~/lib/common/generated/gql/graphql'
import {
  workspaceMoveProjectManagerProjectQuery,
  workspaceMoveProjectManagerWorkspaceQuery
} from '~/lib/workspaces/graphql/queries'
import type { LayoutDialogButton } from '@speckle/ui-components'

const props = defineProps<{
  projectId?: string
  workspaceSlug?: string
}>()

const open = defineModel<boolean>('open', { required: true })

// Internal state management
const selectedProject = ref<WorkspaceMoveProjectSelectProject_ProjectFragment | null>(
  null
)
const selectedWorkspace =
  ref<WorkspaceMoveProjectSelectWorkspace_WorkspaceFragment | null>(null)

// Dialog states based on what we have
const activeDialog = computed(() => {
  if (!selectedProject.value) return 'project'
  if (!selectedWorkspace.value) return 'workspace'
  return 'confirmation'
})

// Fetch project data if provided
const { result: projectResult } = useQuery(
  workspaceMoveProjectManagerProjectQuery,
  () => ({
    projectId: props.projectId || ''
  }),
  () => ({
    enabled: !!props.projectId
  })
)

// Fetch workspace data if provided
const { result: workspaceResult } = useQuery(
  workspaceMoveProjectManagerWorkspaceQuery,
  () => ({
    workspaceSlug: props.workspaceSlug || '',
    projectId: props.projectId
  }),
  () => ({
    enabled: !!props.workspaceSlug
  })
)

// Initialize from props if available
if (projectResult.value?.project) {
  selectedProject.value = projectResult.value.project
}
if (workspaceResult.value?.workspaceBySlug) {
  selectedWorkspace.value = workspaceResult.value.workspaceBySlug
}

const dialogTitle = computed(() => {
  switch (activeDialog.value) {
    case 'project':
      return 'Move projects to workspace'
    case 'workspace':
      return 'Select destination workspace'
    case 'confirmation':
      return 'Confirm project move'
    default:
      return 'Move Project'
  }
})

const dialogButtons = computed((): LayoutDialogButton[] => {
  switch (activeDialog.value) {
    case 'project':
      return [
        {
          text: 'Done',
          props: { color: 'primary' },
          onClick: () => {
            open.value = false
          }
        }
      ]
    case 'workspace':
      return [
        {
          text: 'Back',
          props: { color: 'subtle' },
          onClick: () => {
            selectedProject.value = null
          }
        }
      ]
    default:
      return []
  }
})

const onProjectSelected = (
  project: WorkspaceMoveProjectSelectProject_ProjectFragment
) => {
  selectedProject.value = project
}

const onWorkspaceSelected = (
  workspace: WorkspaceMoveProjectSelectWorkspace_WorkspaceFragment
) => {
  selectedWorkspace.value = workspace
}

const onMoveComplete = () => {
  selectedProject.value = null
  selectedWorkspace.value = null
  open.value = false
}
</script>
