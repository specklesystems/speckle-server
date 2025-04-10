<template>
  <WorkspaceCard
    :logo="workspace.logo ?? ''"
    :name="workspace.name"
    :team-count="workspace.team?.totalCount ?? 0"
  >
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
      <FormButton v-else color="outline" size="sm" @click="onRequest">
        Request to join
      </FormButton>
      <FormButton color="subtle" size="sm" @click="onDismiss">Dismiss</FormButton>
    </template>
  </WorkspaceCard>
</template>

<script setup lang="ts">
import type { LimitedWorkspace } from '~~/lib/common/generated/gql/graphql'
import { useDiscoverableWorkspaces } from '~/lib/workspaces/composables/discoverableWorkspaces'

type WorkspaceWithStatus = LimitedWorkspace & {
  requestStatus: string | null
}

const props = defineProps<{
  workspace: WorkspaceWithStatus
}>()

const { requestToJoinWorkspace, dismissDiscoverableWorkspace } =
  useDiscoverableWorkspaces()

const onRequest = () => {
  requestToJoinWorkspace(props.workspace.id)
}

const onDismiss = () => {
  dismissDiscoverableWorkspace(props.workspace.id)
}
</script>
