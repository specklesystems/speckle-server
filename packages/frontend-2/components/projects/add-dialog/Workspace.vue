<template>
  <div class="flex flex-col gap-4">
    <WorkspaceMoveProjectSelectWorkspace
      :project="undefined"
      :checker="(w) => w.permissions.canCreateProject"
      subheading="New projects can only be created within a workspace."
      @workspace-selected="onWorkspaceSelected"
    />
    <FormButton color="outline" full-width @click="navigateTo(workspaceCreateRoute)">
      Create a new workspace
    </FormButton>
  </div>
</template>
<script setup lang="ts">
import type { WorkspaceMoveProjectSelectWorkspace_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import { workspaceCreateRoute } from '~/lib/common/helpers/route'

const emit = defineEmits<{
  'workspace-selected': [WorkspaceMoveProjectSelectWorkspace_WorkspaceFragment]
  canceled: []
}>()

const onWorkspaceSelected = (
  workspace: WorkspaceMoveProjectSelectWorkspace_WorkspaceFragment
) => {
  emit('workspace-selected', workspace)
}
</script>
