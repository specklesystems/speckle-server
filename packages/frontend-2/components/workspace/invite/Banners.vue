<template>
  <div class="flex flex-col divide-y divide-outline-3">
    <WorkspaceInviteBanner v-for="item in items" :key="item.id" :invite="item" />
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
    workspaceInvites {
      ...WorkspaceInviteBanner_PendingWorkspaceCollaborator
    }
  }
`)

const props = defineProps<{
  invites: WorkspaceInviteBanners_UserFragment
}>()

const items = computed(() => props.invites.workspaceInvites || [])
</script>
