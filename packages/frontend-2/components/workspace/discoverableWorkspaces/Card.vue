<template>
  <WorkspaceCard
    :logo="workspace.logo ?? ''"
    :name="workspace.name"
    :class="requestStatus === 'pending' ? '' : 'bg-foundation'"
    :banner-text="
      workspace.discoverabilityAutoJoinEnabled && requestStatus !== 'approved'
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
            v-if="members.length > 0 && requestStatus !== 'pending'"
            :users="members"
            :max-count="5"
            size="base"
          />
          <div class="text-body-3xs text-foreground-2">
            <span class="font-medium">Admins:&nbsp;</span>
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
      <FormButton v-if="requestStatus === 'pending'" color="outline" size="sm" disabled>
        Join request sent
      </FormButton>
      <div
        v-else-if="requestStatus === 'approved'"
        class="flex gap-1 items-center text-body-2xs font-medium"
      >
        <IconCheck class="w-4 h-4" />
        Workspace joined
      </div>
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
      <FormButton
        v-if="requestStatus === 'approved'"
        color="outline"
        size="sm"
        @click="handleGoToWorkspace"
      >
        Go to workspace
      </FormButton>
    </template>
  </WorkspaceCard>
</template>

<script setup lang="ts">
import type { DiscoverableWorkspace_LimitedWorkspaceFragment } from '~~/lib/common/generated/gql/graphql'
import { useDiscoverableWorkspaces } from '~/lib/workspaces/composables/discoverableWorkspaces'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { workspaceRoute } from '~/lib/common/helpers/route'

const props = defineProps<{
  workspace: DiscoverableWorkspace_LimitedWorkspaceFragment
  showDismissButton?: boolean
  location?: string
  requestStatus: string | null
}>()

const emit = defineEmits<{
  (e: 'go-to-workspace'): void
  (e: 'auto-joined'): void
  (e: 'request'): void
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
  requestToJoinWorkspace(props.workspace, props.location || 'discovery_card')
  if (props.workspace.discoverabilityAutoJoinEnabled) {
    emit('auto-joined')
  } else {
    emit('request')
  }
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

const handleGoToWorkspace = () => {
  navigateTo(workspaceRoute(props.workspace.slug))
  emit('go-to-workspace')
}
</script>
