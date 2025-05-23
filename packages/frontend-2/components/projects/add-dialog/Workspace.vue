<template>
  <div>
    <WorkspaceMoveProjectSelectWorkspace
      :project="undefined"
      :checker="(w) => w.permissions.canCreateProject"
      @workspace-selected="onWorkspaceSelected"
    />
    <div class="flex justify-end gap-2 my-2 mt-6">
      <FormButton type="button" color="outline" @click="$emit('canceled')">
        Cancel
      </FormButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { WorkspaceMoveProjectSelectWorkspace_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'

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
