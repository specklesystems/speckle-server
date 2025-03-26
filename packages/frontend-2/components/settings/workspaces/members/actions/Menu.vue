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
      v-if="showUpdateRoleDialog"
      v-model:open="showDialog"
      :user="targetUser"
      :workspace="workspace"
      :new-role="newRole"
      :is-active-user-target-user="isActiveUserTargetUser"
      :is-only-admin="isOnlyAdmin"
      @success="onDialogSuccess"
    />

    <SettingsWorkspacesMembersActionsUpdateAdminDialog
      v-if="showUpdateAdminDialog"
      v-model:open="showDialog"
      :user="targetUser"
      :workspace="workspace"
      :is-active-user-target-user="isActiveUserTargetUser"
      :is-only-admin="isOnlyAdmin"
      :action="adminAction"
      @success="onDialogSuccess"
    />

    <SettingsWorkspacesMembersActionsUpdateSeatTypeDialog
      v-if="showUpdateSeatTypeDialog"
      v-model:open="showDialog"
      :user="targetUser"
      :workspace="workspace"
      @success="onDialogSuccess"
    />

    <SettingsWorkspacesMembersActionsRemoveFromWorkspaceDialog
      v-if="showRemoveFromWorkspaceDialog"
      v-model:open="showDialog"
      :user="targetUser"
      :workspace="workspace"
      @success="onDialogSuccess"
    />

    <SettingsWorkspacesMembersActionsLeaveWorkspaceDialog
      v-if="showLeaveWorkspaceDialog"
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
  isDomainCompliant?: boolean
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
    props.targetUser.role !== Roles.Workspace.Member &&
    props.targetUser.role !== Roles.Workspace.Admin
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
  return (
    isActiveUserTargetUser.value &&
    isActiveUserWorkspaceAdmin.value &&
    !isOnlyAdmin.value
  )
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

const showUpdateRoleDialog = computed(() => {
  return (
    dialogType.value === WorkspaceUserActionTypes.MakeGuest ||
    dialogType.value === WorkspaceUserActionTypes.MakeMember
  )
})

const showUpdateAdminDialog = computed(() => {
  return (
    dialogType.value === WorkspaceUserActionTypes.MakeAdmin ||
    dialogType.value === WorkspaceUserActionTypes.RemoveAdmin ||
    dialogType.value === WorkspaceUserActionTypes.ResignAdmin
  )
})

const showUpdateSeatTypeDialog = computed(() => {
  return (
    dialogType.value === WorkspaceUserActionTypes.UpgradeEditor ||
    dialogType.value === WorkspaceUserActionTypes.DowngradeEditor
  )
})

const showRemoveFromWorkspaceDialog = computed(() => {
  return dialogType.value === WorkspaceUserActionTypes.RemoveFromWorkspace
})

const showLeaveWorkspaceDialog = computed(() => {
  return dialogType.value === WorkspaceUserActionTypes.LeaveWorkspace
})

const newRole = computed(() => {
  if (!dialogType.value) return undefined
  switch (dialogType.value) {
    case WorkspaceUserActionTypes.MakeAdmin:
      return Roles.Workspace.Admin
    case WorkspaceUserActionTypes.MakeMember:
      return Roles.Workspace.Member
    case WorkspaceUserActionTypes.MakeGuest:
      return Roles.Workspace.Guest
    case WorkspaceUserActionTypes.RemoveAdmin:
    case WorkspaceUserActionTypes.ResignAdmin:
      return Roles.Workspace.Member
    default:
      return undefined
  }
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
