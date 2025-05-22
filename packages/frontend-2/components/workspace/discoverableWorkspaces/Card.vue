<template>
  <WorkspaceCard
    :logo="workspace.logo ?? ''"
    :name="workspace.name"
    :class="requestStatus === 'pending' ? '' : 'bg-foundation'"
  >
    <template #text>
      <div class="flex flex-col gap-y-1">
        <div v-if="workspace.description" class="text-body-2xs line-clamp-3">
          {{ workspace.description }}
        </div>
        <div class="flex flex-col gap-2">
          <UserAvatarGroup
            v-if="members.length > 0 && requestStatus !== 'pending'"
            :users="members"
            :max-count="5"
            size="base"
          />
          <div class="flex gap-1 text-body-3xs text-foreground-2">
            <span class="font-medium">Admins:</span>
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
      <FormButton v-if="requestStatus" color="outline" size="sm" disabled>
        Join request sent
      </FormButton>
      <div v-else class="flex flex-col gap-2 sm:items-end">
        <FormButton color="outline" size="sm" @click="onRequest">
          Request to join
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

const props = defineProps<{
  workspace: DiscoverableWorkspace_LimitedWorkspaceFragment
  showDismissButton?: boolean
  location?: string
  requestStatus: string | null
}>()

const { requestToJoinWorkspace, dismissDiscoverableWorkspace } =
  useDiscoverableWorkspaces()
const mixpanel = useMixpanel()

const adminTeam = computed(() => props.workspace.adminTeam?.map((t) => t.user) ?? [])
const adminIds = computed(() => new Set(adminTeam.value.map((admin) => admin.id)))
const members = computed(() =>
  (props.workspace.team?.items?.map((u) => u.user) ?? []).filter(
    (user) => !adminIds.value.has(user.id)
  )
)

const onRequest = () => {
  requestToJoinWorkspace(props.workspace.id, props.location || 'discovery_card')
}

const onDismiss = async () => {
  await dismissDiscoverableWorkspace(props.workspace.id)
  mixpanel.track('Workspace Discovery Banner Dismissed', {
    workspaceId: props.workspace.id,
    location: 'discovery_card',
    // eslint-disable-next-line camelcase
    workspace_id: props.workspace.id
  })
}
</script>
