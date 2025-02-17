<template>
  <div>
    <WorkspaceInviteWrapper
      v-if="token"
      :workspace-slug="workspaceSlug"
      :token="token"
    />
    <WorkspaceProjectList v-else :workspace-slug="workspaceSlug" />
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
