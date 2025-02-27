<template>
  <div class="flex flex-col items-center gap-2 w-full max-w-lg mx-auto">
    <h1 class="text-heading-xl text-forefround mb-2 font-normal mt-4">
      Join teammates
    </h1>
    <p class="text-center text-body-sm text-foreground-2 mb-8">
      {{ description }}
    </p>
    <WorkspaceDiscoverableWorkspacesCard
      v-for="workspace in discoverableWorkspacesAndJoinRequests"
      :key="`discoverable-${workspace.id}`"
      :workspace="workspace"
    />
    <div class="mt-2 w-full">
      <FormButton
        size="lg"
        full-width
        color="outline"
        @click="navigateTo(workspaceCreateRoute())"
      >
        Create a new workspace
      </FormButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { workspaceCreateRoute } from '~~/lib/common/helpers/route'
import { useDiscoverableWorkspaces } from '~/lib/workspaces/composables/discoverableWorkspaces'

const {
  discoverableWorkspacesAndJoinRequestsCount,
  discoverableWorkspacesAndJoinRequests
} = useDiscoverableWorkspaces()

const description = computed(() => {
  if (discoverableWorkspacesAndJoinRequestsCount.value === 1) {
    return 'We found a workspace that matches your email domain'
  }
  return 'We found workspaces that match your email domain'
})
</script>
