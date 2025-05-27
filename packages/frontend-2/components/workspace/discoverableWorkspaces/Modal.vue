<template>
  <LayoutDialog v-model:open="open" max-width="md" :buttons="dialogButtons">
    <template #header>Join existing workspaces</template>
    <p class="text-body-xs text-foreground-2 pb-3">
      {{
        hasDiscoverableWorkspacesOrJoinRequests
          ? 'Workspaces that match your email domain'
          : 'You have no discoverable workspaces'
      }}
    </p>
    <div class="flex flex-col gap-y-3">
      <WorkspaceDiscoverableWorkspacesCard
        v-for="workspace in workspacesToShow"
        :key="workspace.id"
        :workspace="workspace"
        :request-status="workspace.requestStatus"
        show-dismiss-button
        location="workspace_switcher"
        @auto-joined="open = false"
      />
      <FormButton
        v-if="!showAllWorkspaces && discoverableWorkspacesAndJoinRequestsCount > 3"
        color="subtle"
        size="lg"
        full-width
        @click="showAllWorkspaces = true"
      >
        Show all ({{ discoverableWorkspacesAndJoinRequestsCount }})
      </FormButton>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useDiscoverableWorkspaces } from '~/lib/workspaces/composables/discoverableWorkspaces'

const {
  discoverableWorkspacesAndJoinRequests,
  hasDiscoverableWorkspacesOrJoinRequests,
  discoverableWorkspacesAndJoinRequestsCount
} = useDiscoverableWorkspaces()

const open = defineModel<boolean>('open', { required: true })

const showAllWorkspaces = ref(false)

const workspacesToShow = computed(() => {
  return showAllWorkspaces.value
    ? discoverableWorkspacesAndJoinRequests.value
    : discoverableWorkspacesAndJoinRequests.value.slice(0, 3)
})
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

watch(open, () => {
  showAllWorkspaces.value = false
})
</script>
