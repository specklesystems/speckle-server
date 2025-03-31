<template>
  <div>
    <LayoutMenu
      v-if="actionItems.length"
      v-model:open="showMenu"
      :items="actionItems"
      mount-menu-on-body
      size="lg"
      :menu-position="HorizontalDirection.Left"
      @chosen="({ item: actionItem }) => onActionChosen(actionItem)"
    >
      <FormButton
        :color="showMenu ? 'outline' : 'subtle'"
        hide-text
        :icon-right="showMenu ? XMarkIcon : EllipsisHorizontalIcon"
        @click="toggleMenu"
      />
    </LayoutMenu>

    <SettingsWorkspacesMembersActionsUpdateRoleDialog
      v-if="dialogToShow.updateRole"
      v-model:open="showDialog"
      :user="targetUser"
      :workspace="workspace"
      :new-role="newRole"
      :is-active-user-target-user="isActiveUserTargetUser"
      :is-only-admin="hasSingleAdmin"
      :is-domain-compliant="targetUser.workspaceDomainPolicyCompliant"
      @success="onDialogSuccess"
    />

    <SettingsWorkspacesMembersActionsUpdateAdminDialog
      v-if="dialogToShow.updateAdmin"
      v-model:open="showDialog"
      :user="targetUser"
      :workspace="workspace"
      :is-active-user-target-user="isActiveUserTargetUser"
      :is-only-admin="hasSingleAdmin"
      :action="adminAction"
      @success="onDialogSuccess"
    />

    <SettingsWorkspacesMembersActionsUpdateSeatTypeDialog
      v-if="dialogToShow.updateSeatType"
      v-model:open="showDialog"
      :user="targetUser"
      :workspace="workspace"
      @success="onDialogSuccess"
    />

    <SettingsWorkspacesMembersActionsRemoveFromWorkspaceDialog
      v-if="dialogToShow.removeFromWorkspace"
      v-model:open="showDialog"
      :user="targetUser"
      :workspace="workspace"
      @success="onDialogSuccess"
    />

    <SettingsWorkspacesMembersActionsLeaveWorkspaceDialog
      v-if="dialogToShow.leaveWorkspace"
      v-model:open="showDialog"
      :workspace="workspace"
      :is-only-admin="hasSingleAdmin"
      @success="onDialogSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { Roles, type MaybeNullOrUndefined } from '@speckle/shared'
import { EllipsisHorizontalIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import { HorizontalDirection } from '~~/lib/common/composables/window'
import { WorkspaceUserActionTypes } from '~/lib/settings/helpers/types'
import type { UserItem } from '~/components/settings/workspaces/members/new/MembersTable.vue'
import { useSettingsMembersActions } from '~/lib/settings/composables/menu'
import type {
  SettingsWorkspacesMembersNewGuestsTable_WorkspaceFragment,
  SettingsWorkspacesNewMembersTable_WorkspaceFragment
} from '~/lib/common/generated/gql/graphql'
import { useWorkspaceLastAdminCheck } from '~/lib/workspaces/composables/management'

const props = defineProps<{
  targetUser: UserItem
  workspace?: MaybeNullOrUndefined<
    | SettingsWorkspacesNewMembersTable_WorkspaceFragment
    | SettingsWorkspacesMembersNewGuestsTable_WorkspaceFragment
  >
}>()

const showMenu = ref(false)
const showDialog = ref(false)
const dialogType = ref<WorkspaceUserActionTypes>()

const { hasSingleAdmin } = useWorkspaceLastAdminCheck({
  workspaceSlug: props.workspace?.slug || ''
})

const { actionItems, isActiveUserTargetUser } = useSettingsMembersActions({
  workspaceRole: props.workspace?.role,
  targetUser: props.targetUser
})

const dialogToShow = computed(() => ({
  updateRole:
    dialogType.value === WorkspaceUserActionTypes.MakeGuest ||
    dialogType.value === WorkspaceUserActionTypes.MakeMember,
  updateAdmin:
    dialogType.value === WorkspaceUserActionTypes.MakeAdmin ||
    dialogType.value === WorkspaceUserActionTypes.RemoveAdmin ||
    dialogType.value === WorkspaceUserActionTypes.ResignAdmin,
  updateSeatType:
    dialogType.value === WorkspaceUserActionTypes.UpgradeEditor ||
    dialogType.value === WorkspaceUserActionTypes.DowngradeEditor,
  removeFromWorkspace:
    dialogType.value === WorkspaceUserActionTypes.RemoveFromWorkspace,
  leaveWorkspace: dialogType.value === WorkspaceUserActionTypes.LeaveWorkspace
}))

const newRole = computed(() => {
  const roleMap: Record<WorkspaceUserActionTypes, string | undefined> = {
    [WorkspaceUserActionTypes.MakeAdmin]: Roles.Workspace.Admin,
    [WorkspaceUserActionTypes.MakeMember]: Roles.Workspace.Member,
    [WorkspaceUserActionTypes.MakeGuest]: Roles.Workspace.Guest,
    [WorkspaceUserActionTypes.RemoveAdmin]: Roles.Workspace.Member,
    [WorkspaceUserActionTypes.ResignAdmin]: Roles.Workspace.Member,
    [WorkspaceUserActionTypes.UpgradeEditor]: undefined,
    [WorkspaceUserActionTypes.DowngradeEditor]: undefined,
    [WorkspaceUserActionTypes.RemoveFromWorkspace]: undefined,
    [WorkspaceUserActionTypes.LeaveWorkspace]: undefined
  }
  return dialogType.value ? roleMap[dialogType.value] : undefined
})

const adminAction = computed(() => {
  switch (dialogType.value) {
    case WorkspaceUserActionTypes.MakeAdmin:
      return 'make' as const
    case WorkspaceUserActionTypes.RemoveAdmin:
      return 'remove' as const
    case WorkspaceUserActionTypes.ResignAdmin:
      return 'resign' as const
    default:
      return undefined
  }
})

const onActionChosen = (actionItem: LayoutMenuItem) => {
  dialogType.value = actionItem.id as WorkspaceUserActionTypes
  showDialog.value = true
}

const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

const onDialogSuccess = async () => {
  showDialog.value = false
  dialogType.value = undefined
}
</script>
