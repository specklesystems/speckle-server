<template>
  <LayoutSidebarMenuGroup
    :title="collapsible ? 'About' : undefined"
    :collapsible="collapsible"
    :icon="iconName"
    :icon-click="iconClick"
    :icon-text="iconText"
    no-hover
  >
    <div class="flex flex-col gap-4 text-body-2xs text-foreground-2 pb-0 lg:pb-4 mt-1">
      {{ workspaceInfo.description || 'No workspace description' }}
      <FormButton
        v-if="!workspaceInfo.description && isWorkspaceAdmin"
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
import type { WorkspaceSidebarAbout_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment WorkspaceSidebarAbout_Workspace on Workspace {
    ...WorkspaceDashboardAbout_Workspace
  }
`)

const props = defineProps<{
  workspaceInfo: WorkspaceSidebarAbout_WorkspaceFragment
  collapsible?: boolean
  isWorkspaceAdmin?: boolean
}>()

const emit = defineEmits<{
  (e: 'show-settings-dialog', v: AvailableSettingsMenuKeys): void
}>()

const iconName = computed(() => {
  if (!props.isWorkspaceAdmin) return undefined
  return props.workspaceInfo.description ? 'edit' : 'add'
})

const iconClick = computed(() => {
  if (!props.isWorkspaceAdmin) return undefined
  return () => openSettingsDialog(SettingMenuKeys.Workspace.General)
})

const iconText = computed(() => {
  if (!props.isWorkspaceAdmin) return undefined
  return props.workspaceInfo.description ? 'Edit description' : 'Add description'
})

const openSettingsDialog = (target: AvailableSettingsMenuKeys) => {
  emit('show-settings-dialog', target)
}
</script>
