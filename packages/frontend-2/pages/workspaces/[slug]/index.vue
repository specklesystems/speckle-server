<template>
  <div class="flex w-full">
    <main class="flex-1 h-full overflow-y-auto simple-scrollbar pt-4 md:pt-6">
      <div class="container mx-auto px-6 md:px-8">
        <WorkspaceInviteWrapper
          v-if="token"
          :workspace-slug="workspaceSlug"
          :token="token"
        />
        <WorkspaceDashboard v-else :workspace-slug="workspaceSlug" />
      </div>
    </main>

    <div
      v-if="!token"
      class="hidden lg:flex h-full w-[17rem] shrink-0 border-l border-outline-3 bg-foundation-page"
    >
      <div class="h-full w-full">
        <WorkspaceSidebar :workspace-slug="workspaceSlug" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useOnWorkspaceUpdated } from '~/lib/workspaces/composables/management'
import { useWorkspaceProjectsUpdatedTracking } from '~/lib/workspaces/composables/projectUpdates'

definePageMeta({
  middleware: ['requires-workspaces-enabled', 'require-valid-workspace'],
  layout: 'with-right-sidebar'
})

const route = useRoute()
const workspaceSlug = computed(() => route.params.slug as string)
useOnWorkspaceUpdated({ workspaceSlug })
useWorkspaceProjectsUpdatedTracking(workspaceSlug)

const token = computed(() => route.query.token as string | undefined)
</script>
