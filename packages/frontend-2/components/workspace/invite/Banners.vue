<template>
  <div class="flex flex-col divide-y divide-outline-3">
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

const invites = computed(() => props.invites.workspaceInvites || [])
const discoverableWorkspaces = computed(
  () => props.invites.discoverableWorkspaces || []
)
</script>
