<template>
  <HeaderWithEmptyPage empty-header>
    <template #header-left>
      <HeaderLogoBlock :active="false" class="min-w-40 cursor-pointer" no-link />
    </template>
    <template #header-right>
      <FormButton
        v-if="isWorkspaceNewPlansEnabled"
        size="sm"
        color="outline"
        @click="() => logout({ skipRedirect: false })"
      >
        Sign out
      </FormButton>
      <FormButton v-else size="sm" color="outline" @click="() => navigateTo(homeRoute)">
        Skip
      </FormButton>
    </template>

    <div class="flex flex-col items-center gap-2 w-full max-w-lg mx-auto">
      <h1 class="text-heading-xl text-foreground mb-2 font-normal mt-4">
        Join your coworkers
      </h1>
      <p class="text-center text-body-sm text-foreground-2 mb-8">
        {{ description }}
      </p>
      <WorkspaceDiscoverableWorkspacesCard
        v-for="workspace in workspacesToShow"
        :key="`discoverable-${workspace.id}`"
        :workspace="workspace"
        :request-status="workspace.requestStatus"
        location="workspace_join_page"
        @auto-joined="moveToTop(workspace.id, WorkspaceJoinRequestStatus.Approved)"
        @request="moveToTop(workspace.id, WorkspaceJoinRequestStatus.Pending)"
      />
      <FormButton
        v-if="!showAllWorkspaces && discoverableWorkspacesAndJoinRequestsCount > 3"
        color="subtle"
        size="lg"
        full-width
        @click="showAllWorkspaces = true"
      >
        Show all ({{ discoverableWorkspacesAndJoinRequestsCount }})
      </FormButton>
      <div class="mt-2 w-full flex flex-col gap-2">
        <FormButton
          v-if="hasDiscoverableJoinRequests && !isWorkspaceNewPlansEnabled"
          size="lg"
          full-width
          color="primary"
          @click="navigateTo(homeRoute)"
        >
          Continue
        </FormButton>
        <FormButton
          v-if="!hasApprovedWorkspace"
          size="lg"
          full-width
          color="outline"
          @click="navigateTo(workspaceCreateRoute)"
        >
          Create a new workspace
        </FormButton>
        <FormButton v-else size="lg" full-width @click="navigateTo(homeRoute)">
          Continue to workspace
        </FormButton>
        <FormButton
          v-if="!hasDiscoverableJoinRequests && !isWorkspaceNewPlansEnabled"
          size="lg"
          full-width
          color="subtle"
          @click="navigateTo(homeRoute)"
        >
          Skip for now
        </FormButton>
      </div>
    </div>
  </HeaderWithEmptyPage>
</template>

<script setup lang="ts">
import { useAuthManager } from '~/lib/auth/composables/auth'
import { workspaceCreateRoute, homeRoute } from '~~/lib/common/helpers/route'
import { useDiscoverableWorkspaces } from '~/lib/workspaces/composables/discoverableWorkspaces'
import type { DiscoverableWorkspace_LimitedWorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import { WorkspaceJoinRequestStatus } from '~/lib/common/generated/gql/graphql'

const { logout } = useAuthManager()
const isWorkspaceNewPlansEnabled = useWorkspaceNewPlansEnabled()

const {
  discoverableWorkspacesAndJoinRequestsCount,
  discoverableWorkspacesAndJoinRequests,
  hasDiscoverableJoinRequests
} = useDiscoverableWorkspaces()

const showAllWorkspaces = ref(false)

const actionedWorkspaces = ref<
  (DiscoverableWorkspace_LimitedWorkspaceFragment & { requestStatus: string | null })[]
>([])

const remainingWorkspaces = computed(() => {
  const actionedIds = new Set(actionedWorkspaces.value.map((w) => w.id))
  return (discoverableWorkspacesAndJoinRequests.value || []).filter(
    (workspace) => !actionedIds.has(workspace.id)
  )
})

const localWorkspaces = computed(() => [
  ...actionedWorkspaces.value,
  ...remainingWorkspaces.value
])

const hasApprovedWorkspace = computed(() =>
  localWorkspaces.value.some(
    (workspace) => workspace.requestStatus === WorkspaceJoinRequestStatus.Approved
  )
)

const workspacesToShow = computed(() => {
  return showAllWorkspaces.value
    ? localWorkspaces.value
    : localWorkspaces.value.slice(0, 3)
})

const description = computed(() => {
  if (discoverableWorkspacesAndJoinRequestsCount.value === 1) {
    return 'We found a workspace that matches your email domain'
  }
  return 'We found workspaces that match your email domain'
})

const moveToTop = (workspaceId: string, newStatus: WorkspaceJoinRequestStatus) => {
  const workspace = remainingWorkspaces.value.find((w) => w.id === workspaceId)
  if (workspace) {
    actionedWorkspaces.value.unshift({
      ...workspace,
      requestStatus: newStatus
    })
  }
}
</script>
