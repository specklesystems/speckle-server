<template>
  <div class="flex flex-col">
    <WorkspaceInviteBanner
      v-for="invite in invites"
      :key="invite.id"
      :invite="invite"
    />
    <WorkspaceInviteDiscoverableWorkspaceBanner
      v-for="workspace in discoverableWorkspaces"
      :key="workspace.id"
      :workspace="workspace"
    />
  </div>
</template>
<script setup lang="ts">
import { useSynchronizedCookie } from '~/lib/common/composables/reactiveCookie'
import { CookieKeys } from '~/lib/common/helpers/constants'
import { graphql } from '~~/lib/common/generated/gql'
import type { WorkspaceInviteBanners_UserFragment } from '~~/lib/common/generated/gql/graphql'

/**
 * TODO: Add this to new dashboard page and remove from projects dashboard
 */

graphql(`
  fragment WorkspaceInviteBanners_User on User {
    discoverableWorkspaces {
      ...WorkspaceInviteDiscoverableWorkspaceBanner_DiscoverableWorkspace
    }
    workspaceInvites {
      ...WorkspaceInviteBanner_PendingWorkspaceCollaborator
    }
  }
`)

const props = defineProps<{
  invites: WorkspaceInviteBanners_UserFragment
}>()

const dismissedDiscoverableWorkspaces = useSynchronizedCookie<string[]>(
  CookieKeys.DismissedDiscoverableWorkspaces,
  {
    default: () => []
  }
)

const invites = computed(() => props.invites.workspaceInvites || [])
const discoverableWorkspaces = computed(
  () =>
    props.invites.discoverableWorkspaces?.filter(
      (workspace) => !dismissedDiscoverableWorkspaces.value.includes(workspace.id)
    ) || []
)
</script>
