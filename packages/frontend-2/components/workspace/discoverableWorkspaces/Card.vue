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
      <FormButton v-else color="outline" size="sm" @click="onRequest">
        Request to join
      </FormButton>
      <FormButton color="subtle" size="sm">Dismiss</FormButton>
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

const { requestToJoinWorkspace } = useDiscoverableWorkspaces()

const onRequest = () => {
  requestToJoinWorkspace(props.workspace.id)
}
</script>
