<template>
  <CommonCard class="w-full bg-foundation">
    <div class="flex gap-4">
      <div>
        <WorkspaceAvatar :name="workspace.name" :logo="workspace.logo" size="xl" />
      </div>
      <div class="flex flex-col sm:flex-row gap-4 justify-between flex-1">
        <div class="flex flex-col flex-1">
          <h6 class="text-heading-sm">{{ workspace.name }}</h6>
          <p class="text-body-2xs text-foreground-2">
            {{ workspace.team?.totalCount }}
            {{ workspace.team?.totalCount === 1 ? 'member' : 'members' }}
          </p>
        </div>
        <div class="flex flex-col gap-y-2">
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
        </div>
      </div>
    </div>
  </CommonCard>
</template>

<script setup lang="ts">
import type { LimitedWorkspace } from '~/lib/common/generated/gql/graphql'
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
