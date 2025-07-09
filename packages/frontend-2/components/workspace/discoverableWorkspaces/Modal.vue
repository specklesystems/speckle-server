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
        @auto-joined="moveToTop(workspace.id, WorkspaceJoinRequestStatus.Approved)"
        @request="moveToTop(workspace.id, WorkspaceJoinRequestStatus.Pending)"
        @dismissed="onWorkspaceDismissed"
        @go-to-workspace="open = false"
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
import { WorkspaceJoinRequestStatus } from '~/lib/common/generated/gql/graphql'

const {
  discoverableWorkspacesAndJoinRequests,
  hasDiscoverableWorkspacesOrJoinRequests,
  discoverableWorkspacesAndJoinRequestsCount
} = useDiscoverableWorkspaces()

const open = defineModel<boolean>('open', { required: true })
const showAllWorkspaces = ref(false)

// Workspaces that have been interacted with (moved to top)
const actionedWorkspaces = ref<typeof discoverableWorkspacesAndJoinRequests.value>([])

// Remaining workspaces (excludes ones moved to top or dismissed)
const remainingWorkspaces = computed(() => {
  const actionedIds = new Set(actionedWorkspaces.value.map((w) => w.id))
  return (discoverableWorkspacesAndJoinRequests.value || []).filter(
    (workspace) => !actionedIds.has(workspace.id)
  )
})

// Combined list: top workspaces first, then remaining
const localWorkspaces = computed(() => [
  ...actionedWorkspaces.value,
  ...remainingWorkspaces.value
])

const workspacesToShow = computed(() => {
  return showAllWorkspaces.value
    ? localWorkspaces.value
    : localWorkspaces.value.slice(0, 3)
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

const moveToTop = (workspaceId: string, newStatus: WorkspaceJoinRequestStatus) => {
  const workspace = remainingWorkspaces.value.find((w) => w.id === workspaceId)
  if (workspace) {
    actionedWorkspaces.value.unshift({
      ...workspace,
      requestStatus: newStatus
    })
  }
}

const onWorkspaceDismissed = (workspaceId: string) => {
  actionedWorkspaces.value = actionedWorkspaces.value.filter(
    (w) => w.id !== workspaceId
  )
}

watch(open, () => {
  showAllWorkspaces.value = false
  if (!open.value) {
    actionedWorkspaces.value = []
  }
})
</script>
