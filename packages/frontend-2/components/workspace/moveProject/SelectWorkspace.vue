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
            v-tippy="disabledTooltipText(ws)"
          >
            <button
              class="w-full"
              :class="
                !canMoveToWorkspace(ws) && !isLimitReached(ws)
                  ? 'cursor-not-allowed'
                  : ''
              "
              :disabled="!canMoveToWorkspace(ws) && !isLimitReached(ws)"
              @click="handleWorkspaceClick(ws)"
            >
              <WorkspaceCard
                :logo="ws.logo ?? ''"
                :name="ws.name"
                :clickable="canMoveToWorkspace(ws) || isLimitReached(ws)"
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
                      {{ ws.projects.totalCount }} projects,
                      {{ ws.projects.totalCount }} models
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

    <WorkspacePlanLimitReachedDialog
      v-model:open="showLimitDialog"
      title="Workspace Limit Reached"
      subtitle="This workspace has reached its project limit"
    />
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type {
  WorkspaceMoveProjectSelectProject_ProjectFragment,
  WorkspaceMoveProjectSelectWorkspace_WorkspaceFragment
} from '~~/lib/common/generated/gql/graphql'
import { useQuery } from '@vue/apollo-composable'
import { UserAvatarGroup } from '@speckle/ui-components'
import { workspaceMoveProjectManagerUserQuery } from '~/lib/workspaces/graphql/queries'
import { formatName } from '~/lib/billing/helpers/plan'

graphql(`
  fragment WorkspaceMoveProjectSelectWorkspace_User on User {
    workspaces {
      items {
        ...WorkspaceMoveProjectSelectWorkspace_Workspace
      }
    }
    projects(cursor: $cursor, filter: $filter) {
      items {
        ...WorkspaceMoveProjectSelectProject_Project
      }
      cursor
      totalCount
    }
  }
`)

graphql(`
  fragment WorkspaceMoveProjectSelectWorkspace_Workspace on Workspace {
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
    ...WorkspaceHasCustomDataResidency_Workspace
  }
`)

const props = defineProps<{
  project: WorkspaceMoveProjectSelectProject_ProjectFragment
  eventSource?: string
}>()

const emit = defineEmits<{
  (
    e: 'workspace-selected',
    workspace: WorkspaceMoveProjectSelectWorkspace_WorkspaceFragment
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
const limitReachedWorkspace =
  ref<WorkspaceMoveProjectSelectWorkspace_WorkspaceFragment | null>(null)

const isSsoRequired = computed(
  () => (workspace: WorkspaceMoveProjectSelectWorkspace_WorkspaceFragment) => {
    const permission = workspace.permissions?.canMoveProjectToWorkspace
    return permission?.code === 'WorkspaceSsoSessionNoAccess'
  }
)

const isLimitReached = computed(
  () => (workspace: WorkspaceMoveProjectSelectWorkspace_WorkspaceFragment) => {
    const permission = workspace.permissions?.canMoveProjectToWorkspace
    return permission?.code === 'WorkspaceLimitsReached'
  }
)

const canMoveToWorkspace = computed(
  () => (workspace: WorkspaceMoveProjectSelectWorkspace_WorkspaceFragment) => {
    const permission = workspace.permissions?.canMoveProjectToWorkspace
    return permission?.authorized && permission?.code === 'OK'
  }
)

const disabledTooltipText = computed(
  () => (workspace: WorkspaceMoveProjectSelectWorkspace_WorkspaceFragment) => {
    const permission = workspace.permissions?.canMoveProjectToWorkspace

    // Don't show tooltip for limit reached cases since they're still clickable
    if (permission?.code === 'WorkspaceLimitsReached') {
      return undefined
    }

    if (permission?.code === 'WorkspaceSsoSessionNoAccess') {
      return 'SSO login required to access this workspace'
    }

    // For all other non-authorized cases, show the message
    if (!permission?.authorized) {
      return permission?.message
    }

    return undefined
  }
)

const sortedWorkspaces = computed(() => {
  return [...workspaces.value].sort((a, b) => {
    // Get enabled status for both workspaces
    const aEnabled = canMoveToWorkspace.value(a) || isLimitReached.value(a)
    const bEnabled = canMoveToWorkspace.value(b) || isLimitReached.value(b)

    // If one is enabled and the other isn't, put enabled first
    if (aEnabled && !bEnabled) return -1
    if (!aEnabled && bEnabled) return 1

    // If both have same enabled status, maintain original order
    return 0
  })
})

const handleWorkspaceClick = (
  workspace: WorkspaceMoveProjectSelectWorkspace_WorkspaceFragment
) => {
  if (isLimitReached.value(workspace)) {
    limitReachedWorkspace.value = workspace
    showLimitDialog.value = true
    return
  }

  if (canMoveToWorkspace.value(workspace)) {
    emit('workspace-selected', workspace)
  }
}
</script>
