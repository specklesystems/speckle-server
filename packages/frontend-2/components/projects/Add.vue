<template>
  <div>
    <template v-if="workspace">
      <ProjectsAddDialog
        v-model:open="openNewWorkspaceProject"
        :workspace-id="workspace.id"
      />
      <WorkspacePlanProjectModelLimitReachedDialog
        v-model:open="openWorkspaceProjectLimitsHit"
        :workspace-name="workspace.name"
        :plan="workspace.plan?.name"
        :workspace-role="workspace.role"
        :workspace-slug="workspace.slug || ''"
        location="add_project"
      />
    </template>
    <template v-else>
      <ProjectsAddDialog v-model:open="openNewPersonalProject" />
      <ProjectsAddInWorkspaceDialog v-model:open="openChoosePersonalProjectWorkspace" />
    </template>
  </div>
</template>
<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'
import {
  PersonalProjectsLimitedError,
  WorkspaceLimitsReachedError
} from '@speckle/shared/authz'
import { graphql } from '~/lib/common/generated/gql'
import type { ProjectsAdd_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import { useCanCreatePersonalProject } from '~/lib/projects/composables/permissions'
import { useCanCreateWorkspaceProject } from '~/lib/workspaces/composables/projects/permissions'

graphql(`
  fragment ProjectsAdd_User on User {
    id
    permissions {
      canCreatePersonalProject {
        ...FullPermissionCheckResult
      }
    }
    ...UseCanCreatePersonalProject_User
  }
`)

graphql(`
  fragment ProjectsAdd_Workspace on Workspace {
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
    }
    ...UseCanCreateWorkspaceProject_Workspace
  }
`)

const open = defineModel<boolean>('open', { required: true })
const props = defineProps<{
  workspace?: MaybeNullOrUndefined<ProjectsAdd_WorkspaceFragment>
}>()
const workspaceId = computed(() => props.workspace?.id || undefined)
const { activeUser } = useActiveUser()
const canCreatePersonal = useCanCreatePersonalProject({
  activeUser: computed(() => activeUser.value)
})

const canCreateWorkspace = useCanCreateWorkspaceProject({
  workspace: computed(() => props.workspace)
})

const openNewWorkspaceProject = computed({
  get: () => {
    if (!workspaceId.value || !canCreateWorkspace.canActuallyCreate.value) return false
    return open.value
  },
  set(val) {
    if (!workspaceId.value || !canCreateWorkspace.canActuallyCreate.value) return false
    open.value = val
  }
})

const openWorkspaceProjectLimitsHit = computed({
  get: () => {
    if (
      !workspaceId.value ||
      canCreateWorkspace.cantClickCreateCode.value !== WorkspaceLimitsReachedError.code
    ) {
      return false
    }

    return open.value
  },
  set(val) {
    if (
      !workspaceId.value ||
      canCreateWorkspace.cantClickCreateCode.value !== WorkspaceLimitsReachedError.code
    ) {
      return false
    }

    open.value = val
  }
})

const openNewPersonalProject = computed({
  get: () => {
    if (workspaceId.value || !canCreatePersonal.canActuallyCreate.value) return false
    return open.value
  },
  set(val) {
    if (workspaceId.value || !canCreatePersonal.canActuallyCreate.value) return false
    open.value = val
  }
})

const openChoosePersonalProjectWorkspace = computed({
  get: () => {
    if (
      workspaceId.value ||
      canCreatePersonal.cantClickCreateCode.value !== PersonalProjectsLimitedError.code
    ) {
      return false
    }

    return open.value
  },
  set(val) {
    if (
      workspaceId.value ||
      canCreatePersonal.cantClickCreateCode.value !== PersonalProjectsLimitedError.code
    ) {
      return false
    }
    open.value = val
  }
})
</script>
