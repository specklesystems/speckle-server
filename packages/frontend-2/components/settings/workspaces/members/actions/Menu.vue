<template>
  <div>
    <LayoutMenu
      v-if="filteredActionsItems.length"
      v-model:open="showMenu"
      :items="filteredActionsItems"
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
      :is-only-admin="isOnlyAdmin"
      :is-domain-compliant="targetUser.workspaceDomainPolicyCompliant"
      @success="onDialogSuccess"
    />

    <SettingsWorkspacesMembersActionsUpdateAdminDialog
      v-if="dialogToShow.updateAdmin"
      v-model:open="showDialog"
      :user="targetUser"
      :workspace="workspace"
      :is-active-user-target-user="isActiveUserTargetUser"
      :is-only-admin="isOnlyAdmin"
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
      @success="onDialogSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { Roles, SeatTypes, type MaybeNullOrUndefined } from '@speckle/shared'
import { EllipsisHorizontalIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import { HorizontalDirection } from '~~/lib/common/composables/window'
import { WorkspaceUserActionTypes } from '~/lib/settings/helpers/types'
import type { UserItem } from '~/components/settings/workspaces/members/new/MembersTable.vue'
import { useActiveUser } from '~/lib/auth/composables/activeUser'
import type {
  SettingsWorkspacesMembersNewGuestsTable_WorkspaceFragment,
  SettingsWorkspacesNewMembersTable_WorkspaceFragment
} from '~/lib/common/generated/gql/graphql'

const props = defineProps<{
  targetUser: UserItem
  workspace?: MaybeNullOrUndefined<
    | SettingsWorkspacesNewMembersTable_WorkspaceFragment
    | SettingsWorkspacesMembersNewGuestsTable_WorkspaceFragment
  >
}>()

const { activeUser } = useActiveUser()

const showMenu = ref(false)
const showDialog = ref(false)
const dialogType = ref<WorkspaceUserActionTypes>()

const isActiveUserWorkspaceAdmin = computed(
  () => props.workspace?.role === Roles.Workspace.Admin
)
const isActiveUserTargetUser = computed(
  () => activeUser.value?.id === props.targetUser.id
)

// Computed properties for each action's visibility
const canMakeAdmin = computed(() => {
  return (
    isActiveUserWorkspaceAdmin.value &&
    !isActiveUserTargetUser.value &&
    props.targetUser.role === Roles.Workspace.Member
  )
})

const canRemoveAdmin = computed(() => {
  return (
    isActiveUserWorkspaceAdmin.value &&
    !isActiveUserTargetUser.value &&
    props.targetUser.role === Roles.Workspace.Admin
  )
})

const canMakeGuest = computed(() => {
  return (
    isActiveUserWorkspaceAdmin.value &&
    !isActiveUserTargetUser.value &&
    props.targetUser.role !== Roles.Workspace.Guest
  )
})

const canMakeMember = computed(() => {
  return (
    isActiveUserWorkspaceAdmin.value &&
    !isActiveUserTargetUser.value &&
    props.targetUser.role === Roles.Workspace.Guest
  )
})

const canUpgradeEditor = computed(() => {
  return (
    isActiveUserWorkspaceAdmin.value &&
    !isActiveUserTargetUser.value &&
    props.targetUser.seatType === SeatTypes.Viewer
  )
})

const canDowngradeEditor = computed(() => {
  return (
    isActiveUserWorkspaceAdmin.value &&
    !isActiveUserTargetUser.value &&
    props.targetUser.seatType === SeatTypes.Editor
  )
})

const canRemoveFromWorkspace = computed(() => {
  return (
    isActiveUserWorkspaceAdmin.value &&
    !isActiveUserTargetUser.value &&
    props.targetUser.role !== Roles.Workspace.Admin
  )
})

const canLeaveWorkspace = computed(() => {
  return isActiveUserTargetUser.value
})

const canResignAdmin = computed(() => {
  return isActiveUserTargetUser.value && isActiveUserWorkspaceAdmin.value
})

const isOnlyAdmin = computed(() => {
  const adminUsers = props.workspace?.team.items.filter(
    (user) => user.role === Roles.Workspace.Admin
  )
  return adminUsers?.length === 1
})

const filteredActionsItems = computed(() => {
  const mainItems: LayoutMenuItem[] = []
  const footerItems: LayoutMenuItem[] = []

  // Add main menu items
  if (canMakeAdmin.value) {
    mainItems.push({
      title: 'Make admin...',
      id: WorkspaceUserActionTypes.MakeAdmin
    })
  }
  if (canMakeGuest.value) {
    mainItems.push({
      title: 'Make guest...',
      id: WorkspaceUserActionTypes.MakeGuest
    })
  }
  if (canMakeMember.value) {
    mainItems.push({
      title: 'Make member...',
      id: WorkspaceUserActionTypes.MakeMember
    })
  }
  if (canUpgradeEditor.value) {
    mainItems.push({
      title: 'Upgrade to editor...',
      id: WorkspaceUserActionTypes.UpgradeEditor
    })
  }
  if (canDowngradeEditor.value) {
    mainItems.push({
      title: 'Downgrade to viewer...',
      id: WorkspaceUserActionTypes.DowngradeEditor
    })
  }

  // Add footer items
  if (canRemoveAdmin.value) {
    footerItems.push({
      title: 'Remove admin...',
      id: WorkspaceUserActionTypes.RemoveAdmin
    })
  }
  if (canResignAdmin.value) {
    footerItems.push({
      title: 'Resign as admin...',
      id: WorkspaceUserActionTypes.ResignAdmin
    })
  }
  if (canRemoveFromWorkspace.value) {
    footerItems.push({
      title: 'Remove from workspace...',
      id: WorkspaceUserActionTypes.RemoveFromWorkspace
    })
  }
  if (canLeaveWorkspace.value) {
    footerItems.push({
      title: 'Leave workspace...',
      id: WorkspaceUserActionTypes.LeaveWorkspace
    })
  }

  const result: LayoutMenuItem[][] = []
  if (mainItems.length) result.push(mainItems)
  if (footerItems.length) result.push(footerItems)
  return result
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

const onDialogSuccess = () => {
  showDialog.value = false
  dialogType.value = undefined
}
</script>
