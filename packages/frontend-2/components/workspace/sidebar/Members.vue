<template>
  <LayoutSidebarMenuGroup
    :title="collapsible ? 'Members' : undefined"
    :collapsible="collapsible"
    :icon="iconName"
    :icon-click="iconClick"
    :icon-text="iconText"
    :tag="workspaceInfo.team.totalCount.toString() || undefined"
    no-hover
  >
    <div
      class="flex lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-4 pb-0 lg:pb-4 mt-1"
    >
      <div class="flex items-center gap-1">
        <UserAvatarGroup
          :overlap="false"
          :users="team.map((teamMember) => teamMember.user)"
          :max-avatars="3"
        />
        <button
          v-if="invitedTeamCount && isWorkspaceAdmin"
          class="flex items-center shrink-0 justify-center text-body-3xs px-2 h-8 rounded-full border border-dashed border-outline-2 hover:bg-foundation select-none"
          @click="openSettingsDialog(SettingMenuKeys.Workspace.Members)"
        >
          + {{ invitedTeamCount }} pending
        </button>
      </div>
      <FormButton
        v-if="isWorkspaceAdmin"
        color="outline"
        size="sm"
        @click="$emit('show-invite-dialog')"
      >
        Invite your team
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
import type { WorkspaceSidebarMembers_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment WorkspaceSidebarMembers_Workspace on Workspace {
    ...WorkspaceTeam_Workspace
  }
`)

const props = defineProps<{
  workspaceInfo: WorkspaceSidebarMembers_WorkspaceFragment
  collapsible?: boolean
  isWorkspaceAdmin?: boolean
}>()

const emit = defineEmits<{
  (e: 'show-invite-dialog'): void
  (e: 'show-settings-dialog', v: AvailableSettingsMenuKeys): void
}>()

const openSettingsDialog = (target: AvailableSettingsMenuKeys) => {
  emit('show-settings-dialog', target)
}

const team = computed(() => props.workspaceInfo.team.items || [])

const iconName = computed(() => {
  if (!props.isWorkspaceAdmin) return undefined
  return 'edit'
})

const iconClick = computed(() => {
  if (!props.isWorkspaceAdmin) return undefined
  return () => openSettingsDialog(SettingMenuKeys.Workspace.Members)
})

const iconText = computed(() => {
  if (!props.isWorkspaceAdmin) return undefined
  return 'Edit team'
})

const invitedTeamCount = computed(() => props.workspaceInfo?.invitedTeam?.length ?? 0)
</script>
