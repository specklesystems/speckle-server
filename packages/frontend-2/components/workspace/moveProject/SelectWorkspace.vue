<template>
  <div>
    <div v-if="showLoading" class="py-4 flex items-center justify-center w-full h-32">
      <CommonLoadingIcon size="sm" />
    </div>
    <template v-else>
      <div v-if="hasWorkspaces">
        <p class="mb-4">Select an existing workspaces or create a new one.</p>
        <div class="flex flex-col gap-2">
          <div
            v-for="ws in sortedWorkspaces"
            :key="`${ws.id}-${ws.permissions?.canMoveProjectToWorkspace?.code}`"
            v-tippy="getWorkspaceTooltip(ws)"
          >
            <button
              class="w-full"
              :class="!isWorkspaceDisabled(ws) ? 'cursor-not-allowed' : ''"
              :disabled="isWorkspaceDisabled(ws)"
              @click="handleWorkspaceClick(ws)"
            >
              <WorkspaceCard
                :logo="ws.logo ?? ''"
                :name="ws.name"
                :clickable="!isWorkspaceDisabled(ws)"
              >
                <template #text>
                  <div class="flex flex-col gap-2 items-start">
                    <CommonBadge
                      v-if="isSsoRequired(ws)"
                      color="secondary"
                      class="capitalize"
                      rounded
                    >
                      SSO login required
                    </CommonBadge>
                    <p>
                      {{ ws.plan?.usage.projectCount }} projects,
                      {{ ws.plan?.usage.modelCount }} models
                    </p>
                    <UserAvatarGroup
                      :users="ws.team.items.map((t) => t.user)"
                      :max-count="6"
                      size="sm"
                    />
                  </div>
                </template>
                <template #actions>
                  <CommonBadge color="secondary" rounded>
                    {{ formatName(ws.plan?.name) }}
                  </CommonBadge>
                </template>
              </WorkspaceCard>
            </button>
          </div>
        </div>
      </div>
      <p v-else class="text-body-xs text-foreground">
        Looks like you haven't created any workspaces yet. Workspaces help you easily
        organise and control your digital projects. Create one to move your project
        into.
      </p>
    </template>

    <WorkspacePlanProjectModelLimitReachedDialog
      v-model:open="showLimitDialog"
      :workspace-name="limitReachedWorkspace?.name"
      :plan="limitReachedWorkspace?.plan?.name"
      :workspace-role="limitReachedWorkspace?.role"
      :workspace-slug="limitReachedWorkspace?.slug || ''"
      location="move_project_dialog"
    />
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type {
  PermissionCheckResult,
  WorkspaceMoveProjectManager_ProjectFragment,
  WorkspaceMoveProjectManager_WorkspaceFragment
} from '~~/lib/common/generated/gql/graphql'
import { useQuery } from '@vue/apollo-composable'
import { UserAvatarGroup } from '@speckle/ui-components'
import { workspaceMoveProjectManagerUserQuery } from '~/lib/workspaces/graphql/queries'
import { formatName } from '~/lib/billing/helpers/plan'
import { Roles } from '@speckle/shared'
import {
  WorkspaceLimitsReachedError,
  WorkspaceSsoSessionNoAccessError
} from '@speckle/shared/authz'

graphql(`
  fragment WorkspaceMoveProjectSelectWorkspace_User on User {
    workspaces {
      items {
        ...WorkspaceMoveProjectManager_Workspace
      }
    }
    projects(cursor: $cursor, filter: $filter, sortBy: $sortBy) {
      items {
        ...WorkspaceMoveProjectManager_Project
      }
      cursor
      totalCount
    }
  }
`)

const props = defineProps<{
  project: WorkspaceMoveProjectManager_ProjectFragment
  workspacePermissions?: PermissionCheckResult
}>()

const emit = defineEmits<{
  (
    e: 'workspace-selected',
    workspace: WorkspaceMoveProjectManager_WorkspaceFragment
  ): void
}>()

const { result, loading: initialLoading } = useQuery(
  workspaceMoveProjectManagerUserQuery,
  () => ({
    cursor: null,
    filter: {},
    projectId: props.project.id
  })
)

const workspaces = computed(() => result.value?.activeUser?.workspaces.items ?? [])
const hasWorkspaces = computed(() => workspaces.value.length > 0)
const showLoading = computed(
  () => initialLoading.value && workspaces.value.length === 0
)

const showLimitDialog = ref(false)
const limitReachedWorkspace = ref<WorkspaceMoveProjectManager_WorkspaceFragment | null>(
  null
)

const isWorkspaceAdmin = computed(
  () => (workspace: WorkspaceMoveProjectManager_WorkspaceFragment | null) => {
    if (!workspace) return false
    return workspace.role === Roles.Workspace.Admin
  }
)

const isWorkspaceDisabled = computed(
  () => (workspace: WorkspaceMoveProjectManager_WorkspaceFragment) => {
    if (!isWorkspaceAdmin.value(workspace)) {
      return true
    }

    const permission = workspace.permissions?.canMoveProjectToWorkspace
    return (
      !permission?.authorized && permission?.code !== WorkspaceLimitsReachedError.code
    )
  }
)

const getWorkspaceTooltip = computed(
  () => (workspace: WorkspaceMoveProjectManager_WorkspaceFragment) => {
    if (workspace.permissions.canMoveProjectToWorkspace.authorized) {
      return undefined
    }
    if (
      workspace.permissions.canMoveProjectToWorkspace.code ===
      WorkspaceLimitsReachedError.code
    ) {
      return undefined
    }
    if (!isWorkspaceAdmin.value(workspace)) {
      return 'Only workspace administrators can move projects to this workspace'
    }

    const permission = workspace.permissions?.canMoveProjectToWorkspace
    return permission?.message
  }
)

const sortedWorkspaces = computed(() => {
  return [...workspaces.value].sort((a, b) => {
    const aEnabled =
      a.permissions?.canMoveProjectToWorkspace?.authorized ||
      a.permissions?.canMoveProjectToWorkspace?.code ===
        WorkspaceLimitsReachedError.code
    const bEnabled =
      b.permissions?.canMoveProjectToWorkspace?.authorized ||
      b.permissions?.canMoveProjectToWorkspace?.code ===
        WorkspaceLimitsReachedError.code

    if (aEnabled && !bEnabled) return -1
    if (!aEnabled && bEnabled) return 1
    return 0
  })
})

const handleWorkspaceClick = (
  workspace: WorkspaceMoveProjectManager_WorkspaceFragment
) => {
  const permission = workspace.permissions?.canMoveProjectToWorkspace
  if (permission?.code === WorkspaceLimitsReachedError.code) {
    limitReachedWorkspace.value = workspace
    showLimitDialog.value = true
    return
  }

  if (permission?.authorized) {
    emit('workspace-selected', workspace)
  }
}

const isSsoRequired = computed(
  () => (workspace: WorkspaceMoveProjectManager_WorkspaceFragment) => {
    return (
      workspace.permissions?.canMoveProjectToWorkspace?.code ===
      WorkspaceSsoSessionNoAccessError.code
    )
  }
)
</script>
