<template>
  <LayoutDialog v-model:open="open" max-width="sm" :title="step.title">
    <!-- Project Selection -->
    <WorkspaceMoveProjectSelectProject
      v-if="step.id === DialogStepId.project"
      :workspace="workspaceResult?.workspaceBySlug"
      :project-permissions="projectResult?.project.permissions.canMoveToWorkspace"
      :workspace-id="workspaceId"
      @project-selected="onProjectSelected"
    />

    <!-- Workspace Selection -->
    <WorkspaceMoveProjectSelectWorkspace
      v-if="selectedProject && step.id === DialogStepId.workspace"
      :project="selectedProject"
      :checker="(w) => w.permissions.canMoveProjectToWorkspace"
      @workspace-selected="onWorkspaceSelected"
    />

    <!-- Confirmation -->
    <WorkspaceMoveProjectConfirm
      v-if="
        selectedProject && selectedWorkspace && step.id === DialogStepId.confirmation
      "
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
          @click="navigateTo(workspaceCreateRoute)"
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
  WorkspaceMoveProjectSelectWorkspace_WorkspaceFragment
} from '~/lib/common/generated/gql/graphql'
import {
  workspaceMoveProjectManagerProjectQuery,
  workspaceMoveProjectManagerWorkspaceQuery
} from '~/lib/workspaces/graphql/queries'
import { workspaceCreateRoute } from '~/lib/common/helpers/route'
import { useMultiStepDialog } from '~/lib/common/composables/dialog'

const DialogStepId = {
  project: 'project',
  workspace: 'workspace',
  confirmation: 'confirmation'
} as const
type DialogStepId = (typeof DialogStepId)[keyof typeof DialogStepId]

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
      canMoveToWorkspace(workspaceId: $workspaceId) {
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
    ...WorkspaceMoveProjectSelectWorkspace_Workspace
  }
`)

const props = defineProps<{
  projectId?: string
  workspaceSlug?: string
  workspaceId?: string
}>()

const open = defineModel<boolean>('open', { required: true })

// Internal state management
const selectedProject = ref<WorkspaceMoveProjectManager_ProjectFragment | null>(null)
const selectedWorkspace =
  ref<WorkspaceMoveProjectSelectWorkspace_WorkspaceFragment | null>(null)

const { goToPreviousStep, step, goToNextStep, resetStep } =
  useMultiStepDialog<DialogStepId>({
    steps: computed(() => [
      {
        id: DialogStepId.project,
        title: 'Choose project to move'
      },
      {
        id: DialogStepId.workspace,
        title: 'Choose workspace'
      },
      {
        id: DialogStepId.confirmation,
        title: 'Confirm move'
      }
    ]),
    resolveNextStep: () => {
      if (!selectedProject.value) {
        return DialogStepId.project
      }
      if (!selectedWorkspace.value) {
        return DialogStepId.workspace
      }

      return DialogStepId.confirmation
    },
    resolvePreviousStep: () => {
      if (props.workspaceSlug) {
        return DialogStepId.project
      } else {
        return DialogStepId.workspace
      }
    }
  })

// Fetch project data if provided
const { result: projectResult, onResult: onProjectResult } = useQuery(
  workspaceMoveProjectManagerProjectQuery,
  () => ({
    projectId: props.projectId || '',
    workspaceId: props.workspaceId || ''
  }),
  () => ({
    enabled: !!props.projectId
  })
)

// Fetch workspace data if provided
const { result: workspaceResult, onResult: onWorkspaceResult } = useQuery(
  workspaceMoveProjectManagerWorkspaceQuery,
  () => ({
    workspaceSlug: props.workspaceSlug || '',
    projectId: props.projectId,
    workspaceId: props.workspaceId || ''
  }),
  () => ({
    enabled: !!props.workspaceSlug
  })
)

onProjectResult((res) => {
  if (res.data?.project) {
    selectedProject.value = res.data.project
  }

  resetStep()
})
onWorkspaceResult((res) => {
  if (res.data?.workspaceBySlug) {
    selectedWorkspace.value = res.data.workspaceBySlug
  }

  resetStep()
})

watch(open, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    resetStep()
  }
})

const onProjectSelected = (project: WorkspaceMoveProjectManager_ProjectFragment) => {
  selectedProject.value = project
  // If we already have a workspace (from props), go straight to confirmation
  if (props.workspaceSlug && workspaceResult.value?.workspaceBySlug) {
    selectedWorkspace.value = workspaceResult.value.workspaceBySlug
  }
  goToNextStep()
}

const onWorkspaceSelected = (
  workspace: WorkspaceMoveProjectSelectWorkspace_WorkspaceFragment
) => {
  selectedWorkspace.value = workspace
  goToNextStep()
}

const onMoveComplete = () => {
  selectedProject.value = null
  selectedWorkspace.value = null
  open.value = false
}

const onBack = () => {
  goToPreviousStep()
}
</script>
