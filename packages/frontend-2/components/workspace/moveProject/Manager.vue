<template>
  <LayoutDialog
    v-model:open="open"
    max-width="sm"
    :title="step.title"
    :fullscreen="isSmallDialog ? 'none' : 'mobile'"
    :hide-title="isSmallDialog"
    :hide-buttons="!([DialogStepId.project, DialogStepId.workspace] as string[]).includes(step.id)"
    :is-transparent="isSmallDialog"
    :hide-closer="preventClose"
    :prevent-close-on-click-outside="preventClose"
  >
    <!-- Intro -->
    <WorkspaceMoveProjectIntro
      v-if="step.id === DialogStepId.intro"
      :project="selectedProject"
      :limit-type="limitType"
      @cancel="onCancel"
      @continue="goToNextStep"
    />

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

    <!-- Confirmation (v-show cause if it unmounts, we wont get the move-complete event) -->
    <WorkspaceMoveProjectConfirm
      v-if="selectedProject && selectedWorkspace"
      v-show="step.id === DialogStepId.confirmation"
      :project="selectedProject"
      :workspace="selectedWorkspace"
      @move-complete="onMoveComplete"
      @back="onBack"
    />
    <template #buttons>
      <div class="-my-1 w-full flex justify-end">
        <FormButton
          v-if="step.id === DialogStepId.project && !preventClose"
          color="outline"
          @click="onCancel"
        >
          Cancel
        </FormButton>
        <FormButton
          v-else-if="step.id === DialogStepId.workspace"
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
import type { ViewerLimitsDialogType } from '~/lib/projects/helpers/limits'

const DialogStepId = {
  intro: 'intro',
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

const emit = defineEmits<{
  done: []
}>()

const props = defineProps<{
  projectId?: string
  workspaceSlug?: string
  workspaceId?: string
  showIntro?: boolean
  limitType?: ViewerLimitsDialogType
}>()

const open = defineModel<boolean>('open', { required: true })

// Internal state management
const selectedProject = ref<WorkspaceMoveProjectManager_ProjectFragment | null>(null)
const selectedWorkspace =
  ref<WorkspaceMoveProjectSelectWorkspace_WorkspaceFragment | null>(null)

const { goToPreviousStep, step, goToNextStep, resetStep } =
  useMultiStepDialog<DialogStepId>({
    steps: computed(() => [
      ...(props.showIntro
        ? [
            {
              id: DialogStepId.intro,
              title: 'Move your projects to a workspace'
            }
          ]
        : []),
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
    resolveNextStep: ({ reset }) => {
      if (props.showIntro && reset) {
        return DialogStepId.intro
      }

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
    workspaceId: props.workspaceId
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
    projectId: props.projectId
  }),
  () => ({
    enabled: !!props.workspaceSlug
  })
)

const isSmallDialog = computed(() => step.value.id === DialogStepId.intro)
const preventClose = computed(() => !!props.limitType)

onProjectResult((res) => {
  if (res.data?.project?.id !== selectedProject.value?.id) {
    selectedProject.value = res.data.project
    resetStep()
  }
})

onWorkspaceResult((res) => {
  if (res.data?.workspaceBySlug?.id !== selectedWorkspace.value?.id) {
    resetStep()
  }
})

watch(open, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    if (workspaceResult.value?.workspaceBySlug) {
      selectedWorkspace.value = workspaceResult.value.workspaceBySlug
    }
    if (projectResult.value?.project) {
      selectedProject.value = projectResult.value.project
    }
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
  emit('done')
  selectedProject.value = null
  selectedWorkspace.value = null
  open.value = false
}

const onBack = () => {
  goToPreviousStep()
}

const onCancel = () => {
  open.value = false
  selectedProject.value = null
  selectedWorkspace.value = null
}
</script>
