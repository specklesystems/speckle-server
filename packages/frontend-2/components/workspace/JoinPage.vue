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
      <WorkspaceInviteCard
        v-for="invite in localInvites"
        :key="`invite-${invite.id}`"
        :invite="invite"
        :is-accepted="invite.isAccepted"
        @accepted="onInviteAccepted"
      />
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
        v-if="!showAllWorkspaces && totalWorkspaceItems > 3"
        color="subtle"
        size="lg"
        full-width
        @click="showAllWorkspaces = true"
      >
        Show all ({{ totalWorkspaceItems }})
      </FormButton>
      <div class="mt-2 w-full flex flex-col gap-2">
        <FormButton
          v-if="
            (hasDiscoverableJoinRequests || hasWorkspaceInvites) &&
            !isWorkspaceNewPlansEnabled
          "
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
          v-if="
            !hasDiscoverableJoinRequests &&
            !hasWorkspaceInvites &&
            !isWorkspaceNewPlansEnabled
          "
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
import { useQuery } from '@vue/apollo-composable'
import { navigationWorkspaceInvitesQuery } from '~~/lib/navigation/graphql/queries'

const { logout } = useAuthManager()
const isWorkspaceNewPlansEnabled = useWorkspaceNewPlansEnabled()

const {
  discoverableWorkspacesAndJoinRequestsCount,
  discoverableWorkspacesAndJoinRequests,
  hasDiscoverableJoinRequests
} = useDiscoverableWorkspaces()

const { result: workspaceInviteResult } = useQuery(navigationWorkspaceInvitesQuery)

const showAllWorkspaces = ref(false)

const actionedInvites = ref<
  {
    id: string
    invite: (typeof workspaceInvites.value)[0]
    status: 'accepted' | 'declined'
  }[]
>([])

const workspaceInvites = computed(() => {
  return workspaceInviteResult.value?.activeUser?.workspaceInvites || []
})

const remainingInvites = computed(() => {
  const actionedIds = new Set(actionedInvites.value.map((a) => a.id))
  return workspaceInvites.value.filter((invite) => !actionedIds.has(invite.id))
})

const localInvites = computed(() => [
  ...actionedInvites.value
    .filter((a) => a.status === 'accepted')
    .map((a) => ({ ...a.invite, isAccepted: true })),
  ...remainingInvites.value.map((invite) => ({ ...invite, isAccepted: false }))
])

const actionedWorkspaces = ref<
  (DiscoverableWorkspace_LimitedWorkspaceFragment & { requestStatus: string | null })[]
>([])

const remainingWorkspaces = computed(() => {
  const actionedIds = new Set(actionedWorkspaces.value.map((w) => w.id))
  const inviteWorkspaceIds = new Set(
    localInvites.value.map((invite) => invite.workspace.id)
  )

  return (discoverableWorkspacesAndJoinRequests.value || []).filter(
    (workspace) =>
      !actionedIds.has(workspace.id) && !inviteWorkspaceIds.has(workspace.id)
  )
})

const localWorkspaces = computed(() => [
  ...actionedWorkspaces.value,
  ...remainingWorkspaces.value
])

const hasApprovedWorkspace = computed(() => {
  const hasApprovedDiscoverable = localWorkspaces.value.some(
    (workspace) => workspace.requestStatus === WorkspaceJoinRequestStatus.Approved
  )

  const hasAcceptedInvite = localInvites.value.some((invite) => invite.isAccepted)

  return hasApprovedDiscoverable || hasAcceptedInvite
})

const hasWorkspaceInvites = computed(() => localInvites.value.length > 0)

const workspacesToShow = computed(() => {
  if (showAllWorkspaces.value) {
    return localWorkspaces.value
  }

  // Show up to 3 total cards (invites + discoverable workspaces)
  const inviteCount = localInvites.value.length
  const remainingSlots = Math.max(0, 3 - inviteCount)
  return localWorkspaces.value.slice(0, remainingSlots)
})

const totalWorkspaceItems = computed(() => {
  return localInvites.value.length + discoverableWorkspacesAndJoinRequestsCount.value
})

const description = computed(() => {
  const inviteCount = localInvites.value.length
  const discoverableCount = discoverableWorkspacesAndJoinRequestsCount.value

  if (inviteCount > 0 && discoverableCount > 0) {
    return 'You have workspace invitations and we found workspaces that match your email domain'
  } else if (inviteCount > 0) {
    return inviteCount === 1
      ? 'You have a workspace invitation'
      : 'You have workspace invitations'
  } else if (discoverableCount === 1) {
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

const onInviteAccepted = (inviteId: string) => {
  const invite = localInvites.value.find((inv) => inv.id === inviteId)

  if (invite) {
    actionedInvites.value.unshift({
      id: inviteId,
      invite,
      status: 'accepted'
    })
  }
}
</script>
