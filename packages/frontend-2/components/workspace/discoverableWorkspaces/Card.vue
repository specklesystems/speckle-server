<template>
  <WorkspaceCard :logo="workspace.logo ?? ''" :name="workspace.name">
    <template #text>
      <div class="flex flex-col gap-y-1">
        <div class="text-body-2xs line-clamp-3">
          {{ workspace.description }}
        </div>
        <UserAvatarGroup :users="users" :max-count="5" size="sm" />
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

const users = computed(() => props.workspace.team?.items?.map((u) => u.user) ?? [])

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
