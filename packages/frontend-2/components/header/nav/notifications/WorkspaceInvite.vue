<template>
  <HeaderNavNotificationsInvite
    :invite="invite"
    :disabled="loading"
    @processed="processInvite"
  >
    <template #message>
      <span class="font-medium">{{ invite.invitedBy.name }}</span>
      has invited you to join
      <template v-if="showWorkspaceName">
        the workspace
        <span class="font-medium">{{ invite.workspaceName }}</span>
      </template>
      <template v-else>this workspace</template>
    </template>
  </HeaderNavNotificationsInvite>
</template>
<script setup lang="ts">
import type { Optional } from '@speckle/shared'
import type { HeaderNavNotificationsWorkspaceInvite_PendingWorkspaceCollaboratorFragment } from '~/lib/common/generated/gql/graphql'
import { useWorkspaceInviteManager } from '~/lib/workspaces/composables/management'
import { graphql } from '~~/lib/common/generated/gql'

graphql(`
  fragment HeaderNavNotificationsWorkspaceInvite_PendingWorkspaceCollaborator on PendingWorkspaceCollaborator {
    id
    invitedBy {
      id
      ...LimitedUserAvatar
    }
    workspaceId
    workspaceName
    token
    user {
      id
    }
    ...UseWorkspaceInviteManager_PendingWorkspaceCollaborator
  }
`)

const props = withDefaults(
  defineProps<{
    invite: HeaderNavNotificationsWorkspaceInvite_PendingWorkspaceCollaboratorFragment
    showWorkspaceName?: boolean
  }>(),
  { showWorkspaceName: true }
)

const { loading, accept, decline } = useWorkspaceInviteManager(
  {
    invite: computed(() => props.invite)
  },
  {
    preventRedirect: true
  }
)

const processInvite = async (shouldAccept: boolean, token: Optional<string>) => {
  if (!token) return

  if (shouldAccept) {
    await accept()
  } else {
    await decline()
  }
}
</script>
