<template>
  <LayoutSidebarMenuGroup
    title="Members"
    collapsible
    icon="edit"
    :icon-click="() => openSettingsDialog(SettingMenuKeys.Workspace.Members)"
    icon-text="Edit team"
    :tag="workspaceInfo.team.totalCount.toString() || undefined"
  >
    <div v-if="!isWorkspaceGuest" class="mt-2 flex flex-col gap-2 px-4 pb-4">
      <div class="flex items-center gap-1">
        <UserAvatarGroup
          :users="team.map((teamMember) => teamMember.user)"
          class="max-w-[104px]"
        />
        <button
          v-if="invitedTeamCount"
          class="text-body-3xs p-2 rounded-full border border-dashed border-outline-2 hover:bg-foundation"
          @click="openSettingsDialog(SettingMenuKeys.Workspace.Members)"
        >
          + {{ invitedTeamCount }} pending
        </button>
      </div>
      <FormButton
        color="outline"
        size="sm"
        @click="openSettingsDialog(SettingMenuKeys.Workspace.Security)"
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
import type { WorkspaceSidebar_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment WorkspaceSidebarMembers_Workspace on Workspace {
    team {
      totalCount
      items {
        id
        user {
          id
          name
          ...LimitedUserAvatar
        }
      }
    }
  }
`)

const props = defineProps<{
  workspaceInfo: WorkspaceSidebar_WorkspaceFragment
  isWorkspaceGuest: boolean
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
