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
      v-model:open="showDialog"
      :user="user"
      :type="dialogType"
      @make-admin="onUpdateRole(Roles.Workspace.Admin)"
      @make-guest="onUpdateRole(Roles.Workspace.Guest)"
      @upgrade-editor="onUpdateRole(Roles.Workspace.Member)"
      @remove-user="onRemoveUser"
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
import { useWorkspaceUpdateRole } from '~/lib/workspaces/composables/management'
import { useActiveUser } from '~/lib/auth/composables/activeUser'

const props = defineProps<{
  user: UserItem
  workspaceRole: MaybeNullOrUndefined<string>
  workspaceId: MaybeNullOrUndefined<string>
}>()

const { activeUser } = useActiveUser()

const isWorkspaceAdmin = computed(() => props.workspaceRole === Roles.Workspace.Admin)
const isActiveUserCurrentUser = computed(() => activeUser.value?.id === props.user.id)
const canRemoveMember = computed(
  () => activeUser.value?.id !== props.user.id && isWorkspaceAdmin.value
)

const emit = defineEmits<{
  (e: 'action-chosen', type: UserUpdateActionTypes): void
  (e: 'make-admin'): void
  (e: 'make-guest'): void
  (e: 'upgrade-editor'): void
  (e: 'remove-user', userId: string): void
}>()

const showMenu = ref(false)
const showDialog = ref(false)
const dialogType = ref<UserUpdateActionTypes>()

const updateUserRole = useWorkspaceUpdateRole()

const filteredActionsItems = computed(() => {
  const baseItems: LayoutMenuItem[][] = []

  // Allow upgrading to editor seat if the active user is an admin and target user is a viewer
  if (
    isWorkspaceAdmin.value &&
    !isActiveUserCurrentUser.value &&
    props.user.seatType === 'viewer'
  ) {
    baseItems.push([
      { title: 'Upgrade to editor seat...', id: UserUpdateActionTypes.UpgradeEditor }
    ])
  }

  // Allow making admin if the active user is an admin and target user isn't already admin
  if (
    isWorkspaceAdmin.value &&
    !isActiveUserCurrentUser.value &&
    props.user.role !== Roles.Workspace.Admin
  ) {
    baseItems.push([{ title: 'Make admin...', id: UserUpdateActionTypes.MakeAdmin }])
  }

  // Allow making guest if the active user is an admin and target user isn't already a guest
  if (
    isWorkspaceAdmin.value &&
    !isActiveUserCurrentUser.value &&
    props.user.role !== Roles.Workspace.Guest
  ) {
    baseItems.push([{ title: 'Make guest...', id: UserUpdateActionTypes.MakeGuest }])
  }

  // Allow the current user to leave the workspace
  if (isActiveUserCurrentUser.value) {
    baseItems.push([
      { title: 'Leave workspace...', id: UserUpdateActionTypes.LeaveWorkspace }
    ])
  }

  // Allow removing a member if the active user is an admin and not the current user
  if (canRemoveMember.value) {
    baseItems.push([
      { title: 'Remove from workspace...', id: UserUpdateActionTypes.RemoveMember }
    ])
  }

  return baseItems
})

const onActionChosen = (actionItem: LayoutMenuItem) => {
  dialogType.value = actionItem.id as UserUpdateActionTypes
  showDialog.value = true
  emit('action-chosen', actionItem.id as UserUpdateActionTypes)
}

const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

const onUpdateRole = async (newRoleValue: WorkspaceRoles) => {
  if (!newRoleValue || !props.workspaceId) return

  await updateUserRole({
    userId: props.user.id,
    role: newRoleValue,
    workspaceId: props.workspaceId
  })
}

const onRemoveUser = async () => {
  if (!props.workspaceId) return

  await updateUserRole({
    userId: props.user.id,
    role: null,
    workspaceId: props.workspaceId
  })
}
</script>
