<template>
  <LayoutSidebarMenuGroup
    :title="collapsible ? 'Members' : undefined"
    :collapsible="collapsible"
    icon="edit"
    :icon-click="() => openSettingsDialog(SettingMenuKeys.Workspace.Members)"
    icon-text="Edit team"
    :tag="workspaceInfo.team.totalCount.toString() || undefined"
    no-hover
  >
    <div
      v-if="!isWorkspaceGuest"
      class="flex lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-2 pb-0 lg:pb-4 mt-1"
    >
      <div class="flex items-center gap-1">
        <UserAvatarGroup
          :users="team.map((teamMember) => teamMember.user)"
          class="max-w-[104px]"
        />
        <button
          v-if="invitedTeamCount"
          class="flex items-center justify-center text-body-3xs px-2 h-8 rounded-full border border-dashed border-outline-2 hover:bg-foundation"
          @click="openSettingsDialog(SettingMenuKeys.Workspace.Members)"
        >
          + {{ invitedTeamCount }} pending
        </button>
      </div>
      <FormButton color="outline" size="sm" @click="$emit('show-invite-dialog')">
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
import type { WorkspaceSidebar_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment WorkspaceSidebarMembers_Workspace on Workspace {
    ...WorkspaceTeam_Workspace
  }
`)

const props = defineProps<{
  workspaceInfo: WorkspaceSidebar_WorkspaceFragment
  isWorkspaceGuest: boolean
  collapsible?: boolean
}>()

const emit = defineEmits<{
  (e: 'show-invite-dialog'): void
  (e: 'show-settings-dialog', v: AvailableSettingsMenuKeys): void
}>()

const openSettingsDialog = (target: AvailableSettingsMenuKeys) => {
  emit('show-settings-dialog', target)
}

const team = computed(() => props.workspaceInfo.team.items || [])
const invitedTeamCount = computed(() => props.workspaceInfo?.invitedTeam?.length ?? 0)
</script>
