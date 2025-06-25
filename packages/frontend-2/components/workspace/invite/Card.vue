<template>
  <WorkspaceCard
    :name="invite.workspace.name"
    :logo="invite.workspace.logo ?? undefined"
    :class="isAccepted ? '' : 'bg-foundation'"
    :banner-text="`${invite.invitedBy.name} invited you to join this workspace`"
  >
    <template #text>
      <div class="flex flex-col gap-y-1">
        <div v-if="invite.workspace.description" class="text-body-2xs line-clamp-3">
          {{ invite.workspace.description }}
        </div>
        <div class="flex flex-col gap-1">
          <UserAvatarGroup
            v-if="invite.workspace.team && invite.workspace.team.totalCount > 0"
            :users="invite.workspace.team.items.map((item) => item.user)"
            :max-count="5"
            size="base"
          />
          <div class="text-body-3xs text-foreground-2">
            <span class="font-medium">
              {{ invite.workspace.adminTeam.length === 1 ? 'Admin' : 'Admins' }}:&nbsp;
            </span>
            <span
              v-for="(admin, index) in invite.workspace.adminTeam.slice(0, 3)"
              :key="admin.user.id"
            >
              {{ admin.user.name
              }}{{
                index < 2 && index < invite.workspace.adminTeam.length - 1 ? ', ' : ''
              }}
            </span>
            <span v-if="invite.workspace.adminTeam.length > 3">
              +{{ invite.workspace.adminTeam.length - 3 }}
            </span>
          </div>
        </div>
      </div>
    </template>
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
  fragment WorkspaceInviteCard_LimitedWorkspace on LimitedWorkspace {
    id
    name
    slug
    description
    logo
    adminTeam {
      user {
        id
        name
        avatar
      }
    }
    team {
      totalCount
      items {
        user {
          id
          name
          avatar
        }
      }
    }
  }
`)

graphql(`
  fragment WorkspaceInviteCard_PendingWorkspaceCollaborator on PendingWorkspaceCollaborator {
    id
    workspace {
      ...WorkspaceInviteCard_LimitedWorkspace
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
