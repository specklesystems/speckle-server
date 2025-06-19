<template>
  <div>
    <template v-if="workspace">
      <ProjectsAddDialog
        v-model:open="openNewWorkspaceProject"
        :workspace-id="workspace.id"
      />
      <WorkspacePlanProjectModelLimitReachedDialog
        v-model:open="openWorkspaceLimitsHit"
        :workspace-name="workspace.name"
        :plan="workspace.plan?.name"
        :workspace-role="workspace.role"
        :workspace-slug="workspace.slug || ''"
        :location="location"
      />
    </template>
    <template v-else>
      <ProjectsAddDialog v-model:open="openNewPersonalProject" />
    </template>
  </div>
</template>
<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { WorkspaceLimitsReachedError } from '@speckle/shared/authz'
import { useMultipleDialogBranching } from '~/lib/common/composables/dialog'
import { graphql } from '~/lib/common/generated/gql'
import type { ProjectsAdd_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'
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
    ...UseCanCreateWorkspace_User
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
const props = withDefaults(
  defineProps<{
    workspace?: MaybeNullOrUndefined<ProjectsAdd_WorkspaceFragment>
    location?: string
  }>(),
  {
    location: 'add_project'
  }
)

const workspaceId = computed(() => props.workspace?.id || undefined)

const canCreateWorkspace = useCanCreateWorkspaceProject({
  workspace: computed(() => props.workspace)
})
const { openNewWorkspaceProject, openWorkspaceLimitsHit, openNewPersonalProject } =
  useMultipleDialogBranching({
    noDefault: true,
    open,
    conditions: {
      newWorkspaceProject: computed(
        () =>
          !!(
            workspaceId.value &&
            !([WorkspaceLimitsReachedError.code] as string[]).includes(
              canCreateWorkspace.cantClickCreateCode.value || ''
            )
          )
      ),
      workspaceLimitsHit: computed(
        () =>
          !!(
            workspaceId.value &&
            canCreateWorkspace.cantClickCreateCode.value ===
              WorkspaceLimitsReachedError.code
          )
      ),
      newPersonalProject: computed(() => !workspaceId.value)
    }
  })
</script>
