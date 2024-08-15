<template>
  <InviteBanner :invite="invite" :disabled="loading" @processed="processInvite">
    <template #message>
      <span class="font-medium">{{ invite.invitedBy.name }}</span>
      has invited you to join
      <template v-if="showWorkspaceName">
        the workspace
        <span class="font-medium">{{ invite.workspaceName }}</span>
      </template>
      <template v-else>this workspace</template>
    </template>
  </InviteBanner>
</template>
<script setup lang="ts">
import type { Optional } from '@speckle/shared'
import type { WorkspaceInviteBanner_PendingWorkspaceCollaboratorFragment } from '~/lib/common/generated/gql/graphql'
import { useProcessWorkspaceInvite } from '~/lib/workspaces/composables/management'
import { graphql } from '~~/lib/common/generated/gql'

graphql(`
  fragment WorkspaceInviteBanner_PendingWorkspaceCollaborator on PendingWorkspaceCollaborator {
    id
    invitedBy {
      ...LimitedUserAvatar
    }
    workspaceId
    workspaceName
    token
    user {
      id
    }
  }
`)

const props = withDefaults(
  defineProps<{
    invite: WorkspaceInviteBanner_PendingWorkspaceCollaboratorFragment
    showWorkspaceName?: boolean
  }>(),
  { showWorkspaceName: true }
)

const useInvite = useProcessWorkspaceInvite()

const loading = ref(false)

const processInvite = async (accept: boolean, token: Optional<string>) => {
  if (!token) return

  loading.value = true
  const success = await useInvite({
    workspaceId: props.invite.workspaceId,
    input: {
      accept,
      token
    },
    inviteId: props.invite.id
  })
  loading.value = false
  if (!success) return
}
</script>
