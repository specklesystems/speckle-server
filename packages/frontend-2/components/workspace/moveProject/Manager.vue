<template>
  <LayoutDialog v-model:open="open" max-width="sm" :title="dialogTitle">
    {{ workspaceSlug }}
    <!-- Project Selection -->
    <WorkspaceMoveProjectSelectProject
      v-if="!selectedProject"
      :workspace="workspaceResult?.workspaceBySlug"
      :project-permissions="projectResult?.project.permissions.canMoveToWorkspace"
      @project-selected="onProjectSelected"
    />

    <!-- Workspace Selection -->
    <WorkspaceMoveProjectSelectWorkspace
      v-if="selectedProject && activeDialog === 'workspace'"
      :project="selectedProject"
      :workspace-permissions="
        workspaceResult?.workspaceBySlug.permissions.canMoveProjectToWorkspace
      "
      @workspace-selected="onWorkspaceSelected"
    />

    <!-- Confirmation -->
    <WorkspaceMoveProjectConfirm
      v-if="selectedProject && selectedWorkspace && activeDialog === 'confirmation'"
      :project="selectedProject"
      :workspace="selectedWorkspace"
      @move-complete="onMoveComplete"
      @back="onBack"
    />
    <template #buttons>
      <div class="-my-1 w-full flex justify-end">
        <FormButton v-if="!selectedProject" color="outline" @click="open = false">
          Cancel
        </FormButton>
        <FormButton
          v-else-if="!selectedWorkspace"
          color="outline"
          full-width
          @click="navigateTo(workspaceCreateRoute())"
        >
          Create a new workspace
        </FormButton>
      </div>
    </template>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~~/lib/common/generated/gql'
import type {
  WorkspaceMoveProjectManager_ProjectFragment,
  WorkspaceMoveProjectManager_WorkspaceFragment
} from '~/lib/common/generated/gql/graphql'
import {
  workspaceMoveProjectManagerProjectQuery,
  workspaceMoveProjectManagerWorkspaceQuery
} from '~/lib/workspaces/graphql/queries'
import { workspaceCreateRoute } from '~/lib/common/helpers/route'

graphql(`
  fragment WorkspaceMoveProjectManager_ProjectBase on Project {
    id
    name
    modelCount: models(limit: 0) {
      totalCount
    }
    versions(limit: 0) {
      totalCount
    }
  }
`)

graphql(`
  fragment WorkspaceMoveProjectManager_Project on Project {
    ...WorkspaceMoveProjectManager_ProjectBase
    permissions {
      canMoveToWorkspace {
        ...FullPermissionCheckResult
      }
    }
    workspace {
      id
      slug
      permissions {
        canMoveProjectToWorkspace(projectId: $projectId) {
          ...FullPermissionCheckResult
        }
      }
    }
  }
`)

graphql(`
  fragment WorkspaceMoveProjectManager_Workspace on Workspace {
    id
    role
    name
    logo
    slug
    plan {
      name
      usage {
        projectCount
        modelCount
      }
    }
    permissions {
      canMoveProjectToWorkspace(projectId: $projectId) {
        ...FullPermissionCheckResult
      }
    }
    projects {
      totalCount
    }
    team {
      items {
        user {
          id
          name
          avatar
        }
      }
    }
  }
`)

const props = defineProps<{
  projectId?: string
  workspaceSlug?: string
}>()

const open = defineModel<boolean>('open', { required: true })

// Internal state management
const selectedProject = ref<WorkspaceMoveProjectManager_ProjectFragment | null>(null)
const selectedWorkspace = ref<WorkspaceMoveProjectManager_WorkspaceFragment | null>(
  null
)

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
    case 'confirmation':
      return 'Confirm move'
    case 'project':
    case 'workspace':
    default:
      return 'Ready to move your project? '
  }
})

const onProjectSelected = (project: WorkspaceMoveProjectManager_ProjectFragment) => {
  selectedProject.value = project
  // If we already have a workspace (from props), go straight to confirmation
  if (props.workspaceSlug && workspaceResult.value?.workspaceBySlug) {
    selectedWorkspace.value = workspaceResult.value.workspaceBySlug
  }
}

const onWorkspaceSelected = (
  workspace: WorkspaceMoveProjectManager_WorkspaceFragment
) => {
  selectedWorkspace.value = workspace
}

const onMoveComplete = () => {
  selectedProject.value = null
  selectedWorkspace.value = null
  open.value = false
}

const onBack = () => {
  if (activeDialog.value === 'confirmation') {
    // If we started with a workspace (props.workspaceSlug exists),
    // go back to project selection
    if (props.workspaceSlug) {
      selectedProject.value = null
    } else {
      // Otherwise go back to workspace selection
      selectedWorkspace.value = null
    }
  }
}
</script>
