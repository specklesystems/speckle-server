<template>
  <div>
    <WorkspacePlanProjectModelLimitReachedDialog
      v-if="workspace"
      v-model:open="openWorkspaceLimitsHit"
      :workspace-name="workspace.name"
      :plan="workspace.plan?.name"
      :workspace-role="workspace.role"
      :workspace-slug="workspace.slug"
      location="move_project"
    />
    <WorkspaceMoveProjectManager
      v-model:open="openMoveManager"
      :workspace-slug="workspace?.slug"
      :workspace-id="workspace?.id"
      :project-id="project?.id"
    />
  </div>
</template>
<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { WorkspaceLimitsReachedError } from '@speckle/shared/authz'
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
    permissions {
      canMoveToWorkspace {
        ...FullPermissionCheckResult
      }
    }
    ...UseCanMoveProjectIntoWorkspace_Project
  }
`)

const open = defineModel<boolean>('open', { required: true })
const props = defineProps<{
  project?: MaybeNullOrUndefined<WorkspaceMoveProject_ProjectFragment>
  workspace?: MaybeNullOrUndefined<WorkspaceMoveProject_WorkspaceFragment>
}>()

const canMoveProjectIntoWorkspace = useCanMoveProjectIntoWorkspace({
  project: computed(() => props.project),
  workspace: computed(() => props.workspace)
})

const openMoveManager = computed({
  get: () => {
    if (!canMoveProjectIntoWorkspace.canActuallyMove.value) return false
    return open.value
  },
  set: (value) => {
    if (!canMoveProjectIntoWorkspace.canActuallyMove.value) return false
    open.value = value
  }
})

const openWorkspaceLimitsHit = computed({
  get: () => {
    if (
      canMoveProjectIntoWorkspace.cantClickMoveCode.value !==
      WorkspaceLimitsReachedError.code
    )
      return false
    return open.value
  },
  set: (value) => {
    if (
      canMoveProjectIntoWorkspace.cantClickMoveCode.value !==
      WorkspaceLimitsReachedError.code
    )
      return false
    open.value = value
  }
})
</script>
