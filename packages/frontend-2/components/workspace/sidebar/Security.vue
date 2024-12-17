<template>
  <LayoutSidebarMenuGroup
    title="Security"
    collapsible
    icon="add"
    :icon-click="() => openSettingsDialog(SettingMenuKeys.Workspace.Security)"
    icon-text="Add domain"
    no-hover
  >
    <div class="text-body-2xs text-foreground-2 pb-4 mt-1">
      <div class="flex flex-col gap-2">
        Verified domains not set.
        <FormButton
          color="outline"
          size="sm"
          @click="openSettingsDialog(SettingMenuKeys.Workspace.Security)"
        >
          Improve security
        </FormButton>
      </div>
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
  fragment WorkspaceSidebarSecurity_Workspace on Workspace {
    ...WorkspaceSecurity_Workspace
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
