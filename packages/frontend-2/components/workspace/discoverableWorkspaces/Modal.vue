<template>
  <LayoutDialog v-model:open="open" max-width="md" :buttons="dialogButtons">
    <template #header>Join existing workspaces</template>
    <p class="text-body-xs text-foreground-2 pb-3">
      Workspaces that match your email domain
    </p>
    <WorkspaceDiscoverableWorkspacesCard
      v-for="workspace in discoverableWorkspacesAndJoinRequests"
      :key="workspace.id"
      :workspace="workspace"
    />
  </LayoutDialog>
</template>
<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useDiscoverableWorkspaces } from '~/lib/workspaces/composables/discoverableWorkspaces'

const { discoverableWorkspacesAndJoinRequests } = useDiscoverableWorkspaces()

const open = defineModel<boolean>('open', { required: true })

const dialogButtons = computed((): LayoutDialogButton[] => {
  return [
    {
      text: 'Close',
      onClick: () => {
        open.value = false
      }
    }
  ]
})
</script>
