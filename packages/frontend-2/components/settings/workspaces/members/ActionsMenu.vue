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

    <SettingsWorkspacesMembersActionsDialog
      v-if="dialogConfig"
      v-model:open="showDialog"
      :user="targetUser"
      :title="dialogConfig.title"
      :main-message="dialogConfig.mainMessage"
      :role-info="dialogConfig.roleInfo"
      :seat-count-message="dialogConfig.seatCountMessage"
      :button-text="dialogConfig.buttonText"
      @confirm="onDialogConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import {
  Roles,
  SeatTypes,
  type MaybeNullOrUndefined,
  type WorkspaceRoles,
  type WorkspaceSeatType
} from '@speckle/shared'
import { EllipsisHorizontalIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import { HorizontalDirection } from '~~/lib/common/composables/window'
import { WorkspaceUserActionTypes } from '~/lib/settings/helpers/types'
import type { UserItem } from './new/MembersTable.vue'
import {
  useWorkspaceUpdateRole,
  useWorkspaceUpdateSeatType
} from '~/lib/workspaces/composables/management'
import { useActiveUser } from '~/lib/auth/composables/activeUser'
import {
  WorkspaceUserActionsConfig,
  WorkspaceRoleDescriptions
} from '~/lib/settings/helpers/constants'

const props = defineProps<{
  targetUser: UserItem
  workspaceRole: MaybeNullOrUndefined<string>
  workspaceId: MaybeNullOrUndefined<string>
  isDomainCompliant?: boolean
}>()

const { activeUser } = useActiveUser()
const updateUserRole = useWorkspaceUpdateRole()
const updateUserSeatType = useWorkspaceUpdateSeatType()

const showMenu = ref(false)
const showDialog = ref(false)
const dialogType = ref<WorkspaceUserActionTypes>()

const isActiveUserWorkspaceAdmin = computed(
  () => props.workspaceRole === Roles.Workspace.Admin
)
const isActiveUserTargetUser = computed(
  () => activeUser.value?.id === props.targetUser.id
)

const filteredActionsItems = computed(() => {
  const mainItems: LayoutMenuItem[] = []
  const footerItems: LayoutMenuItem[] = []

  // Iterate through all possible actions and filter them based on:
  // 1. If the current user is an admin (for permission-based actions)
  // 2. If the action is being performed on the current user (for self-actions like "Leave")
  // 3. The target user's current role (to show/hide role change options)
  // 4. The target user's seat type (to show relevant upgrade/downgrade options)
  // Special case: For remove action, we check against 'canRemove' instead of actual role
  Object.entries(WorkspaceUserActionsConfig).forEach(([type, config]) => {
    if (
      config.menu.show({
        isActiveUserWorkspaceAdmin: isActiveUserWorkspaceAdmin.value,
        isActiveUserTargetUser: isActiveUserTargetUser.value,
        targetUserCurrentRole:
          type === WorkspaceUserActionTypes.RemoveMember
            ? 'canRemove'
            : props.targetUser.role,
        targetUserCurrentSeatType: props.targetUser.seatType,
        isDomainCompliant: props.isDomainCompliant
      })
    ) {
      const item = { title: config.menu.title, id: type }

      // Add remove/leave actions to footer, others to main section
      if (
        type === WorkspaceUserActionTypes.RemoveMember ||
        type === WorkspaceUserActionTypes.LeaveWorkspace
      ) {
        footerItems.push(item)
      } else {
        mainItems.push(item)
      }
    }
  })

  const result: LayoutMenuItem[][] = []
  if (mainItems.length) result.push(mainItems)
  if (footerItems.length) result.push(footerItems)
  return result
})

const onActionChosen = (actionItem: LayoutMenuItem) => {
  dialogType.value = actionItem.id as WorkspaceUserActionTypes
  showDialog.value = true
}

const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

const onUpdateRole = async (newRoleValue: WorkspaceRoles) => {
  if (!newRoleValue || !props.workspaceId) return

  await updateUserRole({
    userId: props.targetUser.id,
    role: newRoleValue,
    workspaceId: props.workspaceId
  })
}

const onUpdateSeatType = async (newSeatTypeValue: WorkspaceSeatType) => {
  if (!newSeatTypeValue || !props.workspaceId) return

  await updateUserSeatType({
    userId: props.targetUser.id,
    seatType: newSeatTypeValue,
    workspaceId: props.workspaceId
  })
}

const onRemoveUser = async () => {
  if (!props.workspaceId) return

  await updateUserRole({
    userId: props.targetUser.id,
    role: null,
    workspaceId: props.workspaceId
  })
}

const dialogConfig = computed(() => {
  if (!dialogType.value) return null
  const config = WorkspaceUserActionsConfig[dialogType.value].dialog
  return {
    ...config,
    mainMessage:
      typeof config.mainMessage === 'function'
        ? config.mainMessage(props.targetUser.seatType)
        : config.mainMessage,
    roleInfo: config.showRoleInfo
      ? WorkspaceRoleDescriptions[props.targetUser.role]
      : undefined
  }
})

const onDialogConfirm = async () => {
  if (!props.workspaceId) return

  switch (dialogType.value) {
    case WorkspaceUserActionTypes.MakeAdmin:
      await onUpdateRole(Roles.Workspace.Admin)
      break
    case WorkspaceUserActionTypes.MakeGuest:
      await onUpdateRole(Roles.Workspace.Guest)
      break
    case WorkspaceUserActionTypes.RemoveAdmin:
    case WorkspaceUserActionTypes.MakeMember:
      await onUpdateRole(Roles.Workspace.Member)
      break
    case WorkspaceUserActionTypes.UpgradeEditor:
      await onUpdateSeatType(SeatTypes.Editor)
      break
    case WorkspaceUserActionTypes.DowngradeEditor:
      await onUpdateSeatType(SeatTypes.Viewer)
      break
    case WorkspaceUserActionTypes.RemoveMember:
      await onRemoveUser()
      break
  }
}
</script>
