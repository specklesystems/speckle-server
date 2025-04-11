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
            v-tippy="getDisabledTooltip(ws.permissions?.canMoveProjectToWorkspace)"
          >
            <button
              class="w-full"
              :class="
                !canMoveToWorkspace(ws.permissions?.canMoveProjectToWorkspace) &&
                !isLimitReached(ws.permissions?.canMoveProjectToWorkspace)
                  ? 'cursor-not-allowed'
                  : ''
              "
              :disabled="
                !canMoveToWorkspace(ws.permissions?.canMoveProjectToWorkspace) &&
                !isLimitReached(ws.permissions?.canMoveProjectToWorkspace)
              "
              @click="handleWorkspaceClick(ws)"
            >
              <WorkspaceCard
                :logo="ws.logo ?? ''"
                :name="ws.name"
                :clickable="
                  canMoveToWorkspace(ws.permissions?.canMoveProjectToWorkspace) ||
                  isLimitReached(ws.permissions?.canMoveProjectToWorkspace)
                "
              >
                <template #text>
                  <div class="flex flex-col gap-2 items-start">
                    <CommonBadge
                      v-if="isSsoRequired(ws.permissions?.canMoveProjectToWorkspace)"
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
  WorkspaceMoveProjectManager_ProjectFragment,
  WorkspaceMoveProjectManager_WorkspaceFragment,
  FullPermissionCheckResultFragment
} from '~~/lib/common/generated/gql/graphql'
import { useQuery } from '@vue/apollo-composable'
import { UserAvatarGroup } from '@speckle/ui-components'
import { workspaceMoveProjectManagerUserQuery } from '~/lib/workspaces/graphql/queries'
import { formatName } from '~/lib/billing/helpers/plan'

graphql(`
  fragment WorkspaceMoveProjectSelectWorkspace_User on User {
    workspaces {
      items {
        ...WorkspaceMoveProjectManager_Workspace
      }
    }
    projects(cursor: $cursor, filter: $filter) {
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
  canMoveToWorkspace: (permission: FullPermissionCheckResultFragment) => boolean
  isLimitReached: (permission: FullPermissionCheckResultFragment) => boolean
  isSsoRequired: (permission: FullPermissionCheckResultFragment) => boolean
  getDisabledTooltip: (
    permission: FullPermissionCheckResultFragment
  ) => string | undefined
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

const sortedWorkspaces = computed(() => {
  return [...workspaces.value].sort((a, b) => {
    const aEnabled =
      props.canMoveToWorkspace(a.permissions?.canMoveProjectToWorkspace) ||
      props.isLimitReached(a.permissions?.canMoveProjectToWorkspace)
    const bEnabled =
      props.canMoveToWorkspace(b.permissions?.canMoveProjectToWorkspace) ||
      props.isLimitReached(b.permissions?.canMoveProjectToWorkspace)

    if (aEnabled && !bEnabled) return -1
    if (!aEnabled && bEnabled) return 1
    return 0
  })
})

const handleWorkspaceClick = (
  workspace: WorkspaceMoveProjectManager_WorkspaceFragment
) => {
  if (props.isLimitReached(workspace.permissions?.canMoveProjectToWorkspace)) {
    limitReachedWorkspace.value = workspace
    showLimitDialog.value = true
    return
  }

  if (props.canMoveToWorkspace(workspace.permissions?.canMoveProjectToWorkspace)) {
    emit('workspace-selected', workspace)
  }
}
</script>
