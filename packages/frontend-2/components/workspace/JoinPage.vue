<template>
  <HeaderWithEmptyPage empty-header>
    <template #header-left>
      <HeaderLogoBlock :active="false" class="min-w-40 cursor-pointer" no-link />
    </template>
    <template #header-right>
      <FormButton
        size="sm"
        color="outline"
        @click="() => logout({ skipRedirect: false })"
      >
        Sign out
      </FormButton>
    </template>

    <div class="flex flex-col items-center gap-2 w-full max-w-lg mx-auto">
      <template v-if="loading">
        <div class="py-12 flex flex-col items-center gap-2">
          <CommonLoadingIcon />
        </div>
      </template>
      <template v-else>
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
        <div class="mt-2 w-full flex flex-col gap-2">
          <FormButton
            v-if="hasDiscoverableJoinRequests && !isWorkspaceNewPlansEnabled"
            size="lg"
            full-width
            color="primary"
            @click="navigateTo(homeRoute)"
          >
            Continue
          </FormButton>
          <FormButton
            size="lg"
            full-width
            color="outline"
            @click="navigateTo(workspaceCreateRoute())"
          >
            Create a new workspace
          </FormButton>
          <FormButton
            v-if="!hasDiscoverableJoinRequests && !isWorkspaceNewPlansEnabled"
            size="lg"
            full-width
            color="subtle"
            @click="navigateTo(homeRoute)"
          >
            Skip for now
          </FormButton>
        </div>
      </template>
    </div>
  </HeaderWithEmptyPage>
</template>

<script setup lang="ts">
import { useAuthManager } from '~/lib/auth/composables/auth'
import { workspaceCreateRoute, homeRoute } from '~~/lib/common/helpers/route'
import { useDiscoverableWorkspaces } from '~/lib/workspaces/composables/discoverableWorkspaces'
import { until } from '@vueuse/core'

const { logout } = useAuthManager()
const isWorkspaceNewPlansEnabled = useWorkspaceNewPlansEnabled()

const {
  discoverableWorkspacesAndJoinRequestsCount,
  discoverableWorkspacesAndJoinRequests,
  hasDiscoverableJoinRequests,
  loading: queryLoading
} = useDiscoverableWorkspaces()

const loading = ref(true)

onMounted(async () => {
  // Wait for query to complete
  await until(queryLoading).toBe(false)
  loading.value = false
})

const description = computed(() => {
  if (discoverableWorkspacesAndJoinRequestsCount.value === 1) {
    return 'We found a workspace that matches your email domain'
  }
  return 'We found workspaces that match your email domain'
})
</script>
