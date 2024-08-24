<template>
  <div class="space-y-8 mb-8">
    <h1 class="text-heading-xl text-center">Join workspace</h1>
    <div class="p-4 border border-outline-2 rounded text-body-xs">
      You're accepting an invitation to join
      <span class="font-medium">{{ invite.workspaceName }}</span>
      <!-- prettier-ignore -->
      <template v-if="invite.user">
        as
        <div class="inline-flex items-center">
          <UserAvatar :user="invite.user" size="sm" class="mr-1" />
          <span class="font-medium">{{ invite.user.name }}</span>
        </div>.
      </template>
      <template v-else>
        using the
        <span class="font-medium">{{ invite.email }}</span>
        email address.
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql'
import type { AuthWorkspaceInviteHeader_PendingWorkspaceCollaboratorFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment AuthWorkspaceInviteHeader_PendingWorkspaceCollaborator on PendingWorkspaceCollaborator {
    id
    workspaceName
    email
    user {
      id
      ...LimitedUserAvatar
    }
  }
`)

defineProps<{
  invite: AuthWorkspaceInviteHeader_PendingWorkspaceCollaboratorFragment
}>()
</script>
