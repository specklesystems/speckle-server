<template>
  <LayoutSidebarMenuGroup
    title="About"
    collapsible
    :icon="workspaceInfo.description ? 'edit' : 'add'"
    :icon-click="() => openSettingsDialog(SettingMenuKeys.Workspace.General)"
    :icon-text="workspaceInfo.description ? 'Edit description' : 'Add description'"
    no-hover
  >
    <div class="flex flex-col gap-2 text-body-2xs text-foreground-2 pb-4 mt-1">
      {{ workspaceInfo.description || 'No workspace description' }}
      <FormButton
        v-if="!workspaceInfo.description"
        color="outline"
        size="sm"
        @click="openSettingsDialog(SettingMenuKeys.Workspace.General)"
      >
        Add description
      </FormButton>
    </div>
  </LayoutSidebarMenuGroup>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import {
  type AvailableSettingsMenuKeys,
  SettingMenuKeys
} from '~/lib/settings/helpers/types'
import type { WorkspaceSidebar_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment WorkspaceSidebarAbout_Workspace on Workspace {
    ...WorkspaceAbout_Workspace
  }
`)

defineProps<{
  workspaceInfo: WorkspaceSidebar_WorkspaceFragment
}>()

const emit = defineEmits<{
  (e: 'show-settings-dialog', v: AvailableSettingsMenuKeys): void
}>()

const openSettingsDialog = (target: AvailableSettingsMenuKeys) => {
  emit('show-settings-dialog', target)
}
</script>
