<template>
  <div class="flex flex-col items-center gap-2 w-full max-w-lg mx-auto">
    <h1 class="text-heading-xl text-forefround mb-2 font-normal mt-4">
      Join teammates
    </h1>
    <p class="text-center text-body-sm text-foreground-2 mb-8">
      {{ description }}
    </p>
    <CommonCard
      v-for="discoverableWorkspace in discoverableWorkspacesAndJoinRequests"
      :key="`discoverable-${discoverableWorkspace.id}`"
      class="w-full bg-foundation"
    >
      <div class="flex gap-4">
        <div>
          <WorkspaceAvatar
            :name="discoverableWorkspace.name"
            :logo="discoverableWorkspace.logo"
            size="xl"
          />
        </div>
        <div class="flex flex-col sm:flex-row gap-4 justify-between flex-1">
          <div class="flex flex-col flex-1">
            <h6 class="text-heading-sm">{{ discoverableWorkspace.name }}</h6>
            <p class="text-body-2xs text-foreground-2">
              {{ discoverableWorkspace.team?.totalCount }}
              {{ discoverableWorkspace.team?.totalCount === 1 ? 'member' : 'members' }}
            </p>
          </div>
          <FormButton
            v-if="discoverableWorkspace.requestStatus"
            color="outline"
            size="sm"
            disabled
            class="capitalize"
          >
            {{ discoverableWorkspace.requestStatus }}
          </FormButton>
          <FormButton
            v-else
            color="outline"
            size="sm"
            @click="() => processRequest(true, discoverableWorkspace.id)"
          >
            Request to join
          </FormButton>
        </div>
      </div>
    </CommonCard>
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
  processRequest,
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
