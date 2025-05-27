<template>
  <div>
    <WorkspacePlanProjectModelLimitReachedDialog
      v-if="workspace"
      v-model:open="openWorkspaceLimitsHit"
      :workspace-name="workspace.name"
      :plan="workspace.plan?.name"
      :workspace-role="workspace.role"
      :workspace-slug="workspace.slug"
      :location="location"
      :prevent-close="preventClose"
    />
    <WorkspaceMoveProjectManager
      v-model:open="openDefault"
      :workspace-slug="workspace?.slug"
      :workspace-id="workspace?.id"
      :project-id="project?.id"
      :show-intro="showIntro"
      :prevent-close="preventClose"
      @done="onDone"
    />
  </div>
</template>
<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { WorkspaceLimitsReachedError } from '@speckle/shared/authz'
import { useMultipleDialogBranching } from '~/lib/common/composables/dialog'
import { graphql } from '~/lib/common/generated/gql'
import type {
  WorkspaceMoveProject_ProjectFragment,
  WorkspaceMoveProject_WorkspaceFragment
} from '~/lib/common/generated/gql/graphql'
import { useCanMoveProjectIntoWorkspace } from '~/lib/workspaces/composables/projects/permissions'

graphql(`
  fragment WorkspaceMoveProject_Workspace on Workspace {
    id
    slug
    name
    role
    plan {
      name
    }
    permissions {
      canCreateProject {
        ...FullPermissionCheckResult
      }
      canMoveProjectToWorkspace {
        ...FullPermissionCheckResult
      }
    }
    ...UseCanMoveProjectIntoWorkspace_Workspace
  }
`)

graphql(`
  fragment WorkspaceMoveProject_Project on Project {
    id
    workspaceId
    permissions {
      canMoveToWorkspace {
        ...FullPermissionCheckResult
      }
    }
    ...UseCanMoveProjectIntoWorkspace_Project
  }
`)

const emit = defineEmits<{
  done: []
}>()

const open = defineModel<boolean>('open', { required: true })
const props = withDefaults(
  defineProps<{
    project?: MaybeNullOrUndefined<WorkspaceMoveProject_ProjectFragment>
    workspace?: MaybeNullOrUndefined<WorkspaceMoveProject_WorkspaceFragment>
    location?: string
    showIntro?: boolean
    preventClose?: boolean
  }>(),
  {
    location: 'move_project'
  }
)

const canMoveProjectIntoWorkspace = useCanMoveProjectIntoWorkspace({
  project: computed(() => props.project),
  workspace: computed(() => props.workspace)
})

const isWorkspaceLimitsError = computed(() => {
  return (
    canMoveProjectIntoWorkspace.cantClickMoveCode.value ===
    WorkspaceLimitsReachedError.code
  )
})

const { openDefault, openWorkspaceLimitsHit } = useMultipleDialogBranching({
  open,
  conditions: {
    workspaceLimitsHit: computed(() => isWorkspaceLimitsError.value)
  }
})

const onDone = () => {
  open.value = false
  emit('done')
}
</script>
