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

    <SettingsWorkspacesMembersUpdateDialog
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
import { Roles, type MaybeNullOrUndefined, type WorkspaceRoles } from '@speckle/shared'
import { EllipsisHorizontalIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import { HorizontalDirection } from '~~/lib/common/composables/window'
import { UserUpdateActionTypes } from '~/lib/settings/helpers/types'
import type { UserItem } from './new/MembersTable.vue'
import {
  useWorkspaceUpdateRole,
  useWorkspaceUpdateSeatType
} from '~/lib/workspaces/composables/management'
import { useActiveUser } from '~/lib/auth/composables/activeUser'
import {
  UPDATE_WORKSPACE_MEMBER_CONFIG,
  WORKSPACE_ROLE_DESCRIPTIONS
} from '~/lib/settings/helpers/constants'
import type { WorkspaceSeatType } from '~/lib/common/generated/gql/graphql'

const props = defineProps<{
  targetUser: UserItem
  workspaceRole: MaybeNullOrUndefined<string>
  workspaceId: MaybeNullOrUndefined<string>
}>()

const { activeUser } = useActiveUser()
const updateUserRole = useWorkspaceUpdateRole()
const updateUserSeatType = useWorkspaceUpdateSeatType()

const showMenu = ref(false)
const showDialog = ref(false)
const dialogType = ref<UserUpdateActionTypes>()

const isActiveUserWorkspaceAdmin = computed(
  () => props.workspaceRole === Roles.Workspace.Admin
)
const isActiveUserTargetUser = computed(
  () => activeUser.value?.id === props.targetUser.id
)

const filteredActionsItems = computed(() => {
  const baseItems: LayoutMenuItem[][] = []

  Object.entries(UPDATE_WORKSPACE_MEMBER_CONFIG).forEach(([type, config]) => {
    if (
      config.menu.show({
        isActiveUserWorkspaceAdmin: isActiveUserWorkspaceAdmin.value,
        isActiveUserTargetUser: isActiveUserTargetUser.value,
        targetUserCurrentRole:
          type === UserUpdateActionTypes.RemoveMember
            ? 'canRemove'
            : props.targetUser.role,
        targetUserCurrentSeatType: props.targetUser.seatType
      })
    ) {
      baseItems.push([{ title: config.menu.title, id: type as UserUpdateActionTypes }])
    }
  })

  return baseItems
})

const onActionChosen = (actionItem: LayoutMenuItem) => {
  dialogType.value = actionItem.id as UserUpdateActionTypes
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
  const config = UPDATE_WORKSPACE_MEMBER_CONFIG[dialogType.value].dialog
  return {
    ...config,
    mainMessage:
      typeof config.mainMessage === 'function'
        ? config.mainMessage(props.targetUser.seatType)
        : config.mainMessage,
    roleInfo: config.showRoleInfo
      ? WORKSPACE_ROLE_DESCRIPTIONS[props.targetUser.role]
      : undefined
  }
})

const onDialogConfirm = async () => {
  if (!props.workspaceId) return

  switch (dialogType.value) {
    case UserUpdateActionTypes.MakeAdmin:
      await onUpdateRole(Roles.Workspace.Admin)
      break
    case UserUpdateActionTypes.MakeGuest:
      await onUpdateRole(Roles.Workspace.Guest)
      break
    case UserUpdateActionTypes.MakeMember:
      await onUpdateRole(Roles.Workspace.Member)
      break
    case UserUpdateActionTypes.UpgradeEditor:
      await onUpdateSeatType('editor')
      break
    case UserUpdateActionTypes.DowngradeEditor:
      await onUpdateSeatType('viewer')
      break
    case UserUpdateActionTypes.RemoveMember:
      await onRemoveUser()
      break
  }
}
</script>
