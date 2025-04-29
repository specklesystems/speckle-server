<template>
  <WorkspaceCard :logo="workspace.logo ?? ''" :name="workspace.name">
    <template #text>
      <div class="flex flex-col gap-y-1">
        <div class="text-body-2xs line-clamp-3">
          {{ workspace.description }}
        </div>
        <div class="text-body-2xs">{{ workspace.team?.totalCount }} members</div>
      </div>
    </template>
    <template #actions>
      <FormButton
        v-if="workspace.requestStatus"
        color="outline"
        size="sm"
        disabled
        class="capitalize"
      >
        {{ workspace.requestStatus }}
      </FormButton>
      <div v-else class="flex flex-col gap-2 items-end">
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
import type { LimitedWorkspace } from '~~/lib/common/generated/gql/graphql'
import { useDiscoverableWorkspaces } from '~/lib/workspaces/composables/discoverableWorkspaces'
import { useMixpanel } from '~~/lib/core/composables/mp'

type WorkspaceWithStatus = LimitedWorkspace & {
  requestStatus: string | null
}

const props = defineProps<{
  workspace: WorkspaceWithStatus
  showDismissButton?: boolean
  location?: string
}>()

const { requestToJoinWorkspace, dismissDiscoverableWorkspace } =
  useDiscoverableWorkspaces()
const mixpanel = useMixpanel()

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
