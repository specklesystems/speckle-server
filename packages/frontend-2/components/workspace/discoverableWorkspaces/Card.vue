<template>
  <WorkspaceCard
    :logo="workspace.logo ?? ''"
    :name="workspace.name"
    :class="isActioned ? '' : 'bg-foundation'"
    :banner-text="
      workspace.discoverabilityAutoJoinEnabled &&
      requestStatus !== WorkspaceJoinRequestStatus.Approved
        ? 'You can join this workspace automatically. No admin approval needed.'
        : null
    "
  >
    <template #text>
      <div class="flex flex-col gap-y-1">
        <div v-if="workspace.description" class="text-body-2xs line-clamp-3">
          {{ workspace.description }}
        </div>
        <div class="flex flex-col gap-1">
          <UserAvatarGroup
            v-if="members.length > 0"
            :users="members"
            :max-count="5"
            size="base"
          />
          <div class="text-body-3xs text-foreground-2">
            <span class="font-medium">
              {{ adminTeam.length === 1 ? 'Admin' : 'Admins' }}:&nbsp;
            </span>
            <span v-for="(admin, index) in adminTeam.slice(0, 3)" :key="admin.id">
              {{ admin.name
              }}{{ index < 2 && index < adminTeam.length - 1 ? ', ' : '' }}
            </span>
            <span v-if="adminTeam.length > 3">+{{ adminTeam.length - 3 }}</span>
          </div>
        </div>
      </div>
    </template>
    <template #actions>
      <FormButton
        v-if="requestStatus === WorkspaceJoinRequestStatus.Pending"
        color="outline"
        size="sm"
        disabled
      >
        Join request sent
      </FormButton>
      <FormButton
        v-else-if="requestStatus === WorkspaceJoinRequestStatus.Approved"
        color="outline"
        size="sm"
        :icon-left="Check"
        disabled
      >
        Workspace joined
      </FormButton>
      <div v-else class="flex flex-col gap-2 sm:items-end">
        <FormButton color="outline" size="sm" @click="onRequest">
          {{
            workspace.discoverabilityAutoJoinEnabled
              ? 'Join workspace'
              : 'Request to join'
          }}
        </FormButton>
        <FormButton
          v-if="showDismissButton"
          color="subtle"
          size="sm"
          @click="onDismiss"
        >
          Dismiss
        </FormButton>
      </div>
    </template>
  </WorkspaceCard>
</template>

<script setup lang="ts">
import type { DiscoverableWorkspace_LimitedWorkspaceFragment } from '~~/lib/common/generated/gql/graphql'
import { useDiscoverableWorkspaces } from '~/lib/workspaces/composables/discoverableWorkspaces'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { Check } from 'lucide-vue-next'
import { WorkspaceJoinRequestStatus } from '~/lib/common/generated/gql/graphql'

const props = defineProps<{
  workspace: DiscoverableWorkspace_LimitedWorkspaceFragment
  showDismissButton?: boolean
  location?: string
  requestStatus: string | null
}>()

const emit = defineEmits<{
  (e: 'auto-joined'): void
  (e: 'request'): void
  (e: 'dismissed', workspaceId: string): void
}>()

const { requestToJoinWorkspace, dismissDiscoverableWorkspace } =
  useDiscoverableWorkspaces()
const mixpanel = useMixpanel()

const adminTeam = computed(() => props.workspace.adminTeam?.map((t) => t.user) ?? [])
const adminIds = computed(() => new Set(adminTeam.value.map((admin) => admin.id)))
const allMembers = computed(() => props.workspace.team?.items?.map((u) => u.user) ?? [])
const members = computed(() => {
  // Only deduplicate if there's exactly one person total (admin who is also the only member)
  const totalUniqueUsers = new Set([
    ...adminTeam.value.map((admin) => admin.id),
    ...allMembers.value.map((member) => member.id)
  ]).size

  if (totalUniqueUsers === 1) {
    // Single user case: filter out admins from members to avoid duplication
    return allMembers.value.filter((user) => !adminIds.value.has(user.id))
  } else {
    // Multiple users: show all members including those who are also admins
    return allMembers.value
  }
})

const isActioned = computed(() => {
  return (
    props.requestStatus === WorkspaceJoinRequestStatus.Approved ||
    props.requestStatus === WorkspaceJoinRequestStatus.Pending
  )
})

const onRequest = () => {
  requestToJoinWorkspace(props.workspace, props.location || 'discovery_card')
  if (props.workspace.discoverabilityAutoJoinEnabled) {
    emit('auto-joined')
  } else {
    emit('request')
  }
}

const onDismiss = async () => {
  await dismissDiscoverableWorkspace(props.workspace.id)
  emit('dismissed', props.workspace.id)
  mixpanel.track('Workspace Discovery Banner Dismissed', {
    workspaceId: props.workspace.id,
    location: 'discovery_card',
    // eslint-disable-next-line camelcase
    workspace_id: props.workspace.id
  })
}
</script>
