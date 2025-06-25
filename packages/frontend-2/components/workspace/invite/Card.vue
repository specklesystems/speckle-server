<template>
  <WorkspaceCard
    :name="invite.workspace.name"
    :class="isAccepted ? '' : 'bg-foundation'"
    :banner-text="`${invite.invitedBy.name} invited you to join this workspace`"
  >
    <template #actions>
      <FormButton
        v-if="isAccepted"
        color="outline"
        size="sm"
        :icon-left="CheckIcon"
        disabled
      >
        Workspace joined
      </FormButton>
      <div v-else class="flex flex-col gap-2 sm:items-end">
        <FormButton color="primary" size="sm" :disabled="loading" @click="onAccept">
          Accept invitation
        </FormButton>
      </div>
    </template>
  </WorkspaceCard>
</template>

<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql'
import type { WorkspaceInviteCard_PendingWorkspaceCollaboratorFragment } from '~/lib/common/generated/gql/graphql'
import { useWorkspaceInviteManager } from '~/lib/workspaces/composables/management'
import { CheckIcon } from '@heroicons/vue/20/solid'

graphql(`
  fragment WorkspaceInviteCard_PendingWorkspaceCollaborator on PendingWorkspaceCollaborator {
    id
    workspace {
      id
      slug
      name
      logo
    }
    invitedBy {
      id
      name
    }
  }
`)

const props = defineProps<{
  invite: WorkspaceInviteCard_PendingWorkspaceCollaboratorFragment
  isAccepted?: boolean
}>()

const emit = defineEmits<{
  (e: 'accepted', inviteId: string): void
}>()

const { loading, accept } = useWorkspaceInviteManager(
  {
    invite: computed(() => props.invite)
  },
  {
    preventRedirect: true
  }
)

const onAccept = async () => {
  emit('accepted', props.invite.id)
  await accept()
}
</script>
