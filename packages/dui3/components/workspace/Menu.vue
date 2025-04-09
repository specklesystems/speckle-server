<template>
  <div class="flex-grow">
    <slot name="activator" :toggle="toggleDialog"></slot>
    <CommonDialog
      v-model:open="showWorkspaceSelectorDialog"
      :title="`Select workspace`"
      fullscreen="none"
    >
      <WorkspaceListItem
        v-for="workspace in workspacesWithPersonalProjects"
        :key="workspace.id"
        :current-selected-workspace-id="currentSelectedWorkspaceId"
        :workspace="workspace"
        @select="
          $emit('workspace:selected', workspace), (showWorkspaceSelectorDialog = false)
        "
      ></WorkspaceListItem>
    </CommonDialog>
  </div>
</template>

<script setup lang="ts">
import type { WorkspaceListWorkspaceItemFragment } from '~/lib/common/generated/gql/graphql'

const showWorkspaceSelectorDialog = ref(false)

const props = defineProps<{
  workspaces: WorkspaceListWorkspaceItemFragment[]
  currentSelectedWorkspaceId: string
}>()

defineEmits<{
  (e: 'workspace:selected', result: WorkspaceListWorkspaceItemFragment): void
}>()

const workspacesWithPersonalProjects = computed(() => [
  ...props.workspaces,
  {
    id: 'personalProject',
    name: 'Personal Projects'
  } as WorkspaceListWorkspaceItemFragment
])

const toggleDialog = () => {
  showWorkspaceSelectorDialog.value = !showWorkspaceSelectorDialog.value
}
</script>
