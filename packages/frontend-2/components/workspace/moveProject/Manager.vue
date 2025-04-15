<template>
  <LayoutDialog v-model:open="open" max-width="sm" :title="dialogTitle">
    <!-- Project Selection -->
    <WorkspaceMoveProjectSelectProject
      v-if="!selectedProject"
      :workspace-slug="workspaceSlug"
      :can-move-to-workspace="canMoveToWorkspace"
      :is-sso-required="isSsoRequired"
      :is-limit-reached="isLimitReached"
      :get-disabled-tooltip="getDisabledTooltip"
      @project-selected="onProjectSelected"
    />

    <!-- Workspace Selection -->
    <WorkspaceMoveProjectSelectWorkspace
      v-if="selectedProject && activeDialog === 'workspace'"
      :project="selectedProject"
      :can-move-to-workspace="canMoveToWorkspace"
      :is-sso-required="isSsoRequired"
      :is-limit-reached="isLimitReached"
      :get-disabled-tooltip="getDisabledTooltip"
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
  FullPermissionCheckResultFragment,
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

// Permission check computeds
const isSsoRequired = computed(
  () => (permission: FullPermissionCheckResultFragment) => {
    return permission?.code === 'WorkspaceSsoSessionNoAccess'
  }
)

const isLimitReached = computed(
  () => (permission: FullPermissionCheckResultFragment) => {
    return permission?.code === 'WorkspaceLimitsReached'
  }
)

const canMoveToWorkspace = computed(
  () => (permission: FullPermissionCheckResultFragment) => {
    return permission?.authorized && permission?.code === 'OK'
  }
)

const getDisabledTooltip = computed(
  () => (permission: FullPermissionCheckResultFragment) => {
    if (permission?.code === 'WorkspaceLimitsReached') {
      return undefined
    }

    if (permission?.code === 'WorkspaceSsoSessionNoAccess') {
      return 'SSO login required to access this workspace'
    }

    if (!permission?.authorized) {
      return permission?.message
    }

    return undefined
  }
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
