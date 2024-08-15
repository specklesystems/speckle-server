<template>
  <div class="space-y-8 mb-8">
    <h1 class="text-heading-xl text-center">Join workspace</h1>
    <div class="p-4 border border-outline-2 rounded text-body-xs">
      You're accepting an invitation to join
      <span class="font-semibold">{{ invite.workspaceName }}</span>
      <template v-if="isNewUser">
        using the
        <span class="font-semibold">{{ invite.email }}</span>
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
    }
  }
`)

const props = defineProps<{
  invite: AuthWorkspaceInviteHeader_PendingWorkspaceCollaboratorFragment
}>()

const isNewUser = computed(() => !props.invite.user)
</script>
