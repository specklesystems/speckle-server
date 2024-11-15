<template>
  <div>
    <SettingsWorkspacesMembersTableHeader
      v-model:search="search"
      v-model:role="roleFilter"
      search-placeholder="Search members..."
      :workspace-id="workspaceId"
      :workspace="workspace"
      show-role-filter
    />
    <LayoutTable
      class="mt-6 md:mt-8 mb-12"
      :columns="[
        { id: 'name', header: 'Name', classes: 'col-span-3' },
        { id: 'company', header: 'Company', classes: 'col-span-3' },
        { id: 'verified', header: 'Status', classes: 'col-span-3' },
        { id: 'role', header: 'Role', classes: 'col-span-2' },
        {
          id: 'actions',
          header: '',
          classes: 'col-span-1 flex items-center justify-end'
        }
      ]"
      :items="members"
      :loading="searchResultLoading"
      :empty-message="
        hasNoResults ? 'No members found' : 'This workspace has no members'
      "
    >
      <template #name="{ item }">
        <div class="flex items-center gap-2">
          <UserAvatar hide-tooltip :user="item" />
          <span class="truncate text-body-xs text-foreground">{{ item.name }}</span>
          <div
            v-if="
              item.workspaceDomainPolicyCompliant === false &&
              item.role !== Roles.Workspace.Guest
            "
            v-tippy="
              'This user does not comply with the domain policy set on this workspace'
            "
          >
            <ExclamationCircleIcon class="text-danger w-5 w-4" />
          </div>
        </div>
      </template>
      <template #company="{ item }">
        <span class="text-body-xs text-foreground">
          {{ item.company ? item.company : '-' }}
        </span>
      </template>
      <template #verified="{ item }">
        <span class="text-body-xs text-foreground-2">
          {{ item.verified ? 'Verified' : 'Unverified' }}
        </span>
      </template>
      <template #role="{ item }">
        <span class="text-foreground-2">
          <span>
            {{ isWorkspaceRole(item.role) ? getRoleLabel(item.role).title : '' }}
          </span>
        </span>
      </template>
      <template #actions="{ item }">
        <LayoutMenu
          v-if="filteredActionsItems(item).length"
          v-model:open="showActionsMenu[item.id]"
          :items="filteredActionsItems(item)"
          mount-menu-on-body
          :menu-position="HorizontalDirection.Left"
          @chosen="({ item: actionItem }) => onActionChosen(actionItem, item)"
        >
          <FormButton
            :color="showActionsMenu[item.id] ? 'outline' : 'subtle'"
            hide-text
            :icon-right="showActionsMenu[item.id] ? XMarkIcon : EllipsisHorizontalIcon"
            @click="toggleMenu(item.id)"
          />
        </LayoutMenu>
        <div v-else />
      </template>
    </LayoutTable>
    <SettingsSharedChangeRoleDialog
      v-model:open="showChangeUserRoleDialog"
      :workspace-domain-policy-compliant="userToModify?.workspaceDomainPolicyCompliant"
      :current-role="currentUserRole"
      @update-role="onUpdateRole"
    />
    <SettingsSharedDeleteUserDialog
      v-model:open="showDeleteUserRoleDialog"
      :title="
        userToModify?.role === Roles.Workspace.Guest ? 'Remove guest' : 'Remove user'
      "
      :name="userToModify?.name ?? ''"
      @remove-user="onRemoveUser"
    />
    <SettingsWorkspacesGeneralLeaveDialog
      v-if="workspace"
      v-model:open="showLeaveDialog"
      :workspace="workspace"
    />
  </div>
</template>

<script setup lang="ts">
import { Roles, type WorkspaceRoles } from '@speckle/shared'
import { settingsWorkspacesMembersSearchQuery } from '~~/lib/settings/graphql/queries'
import { useQuery } from '@vue/apollo-composable'
import type { SettingsWorkspacesMembersMembersTable_WorkspaceFragment } from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~/lib/common/generated/gql'
import {
  EllipsisHorizontalIcon,
  ExclamationCircleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import { useWorkspaceUpdateRole } from '~/lib/workspaces/composables/management'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import { HorizontalDirection } from '~~/lib/common/composables/window'
import { getRoleLabel } from '~~/lib/settings/helpers/utils'

type UserItem = (typeof members)['value'][0]

graphql(`
  fragment SettingsWorkspacesMembersMembersTable_WorkspaceCollaborator on WorkspaceCollaborator {
    id
    role
    user {
      id
      avatar
      name
      company
      verified
      workspaceDomainPolicyCompliant(workspaceId: $workspaceId)
    }
  }
`)

graphql(`
  fragment SettingsWorkspacesMembersMembersTable_Workspace on Workspace {
    id
    name
    ...SettingsWorkspacesMembersTableHeader_Workspace
    team {
      items {
        id
        ...SettingsWorkspacesMembersMembersTable_WorkspaceCollaborator
      }
    }
  }
`)

enum ActionTypes {
  RemoveMember = 'remove-member',
  ChangeRole = 'change-role',
  LeaveWorkspace = 'leave-workspace'
}

const props = defineProps<{
  workspace?: SettingsWorkspacesMembersMembersTable_WorkspaceFragment
  workspaceId: string
}>()

const search = ref('')
const roleFilter = ref<WorkspaceRoles>()

const { result: searchResult, loading: searchResultLoading } = useQuery(
  settingsWorkspacesMembersSearchQuery,
  () => ({
    filter: {
      search: search.value,
      roles: roleFilter.value
        ? [roleFilter.value]
        : [Roles.Workspace.Admin, Roles.Workspace.Member]
    },
    workspaceId: props.workspaceId
  }),
  () => ({
    enabled: !!search.value.length || !!roleFilter.value
  })
)

const updateUserRole = useWorkspaceUpdateRole()
const { activeUser } = useActiveUser()

const showChangeUserRoleDialog = ref(false)
const showDeleteUserRoleDialog = ref(false)
const showLeaveDialog = ref(false)
const newRole = ref<WorkspaceRoles>()
const userToModify = ref<UserItem>()

const showActionsMenu = ref<Record<string, boolean>>({})

const members = computed(() => {
  const memberArray =
    search.value.length || roleFilter.value
      ? searchResult.value?.workspace?.team.items
      : props.workspace?.team.items
  return (memberArray || [])
    .map(({ user, ...rest }) => ({
      ...user,
      ...rest
    }))
    .filter((user) => user.role !== Roles.Workspace.Guest)
})

const isWorkspaceAdmin = computed(() => props.workspace?.role === Roles.Workspace.Admin)
const isActiveUserCurrentUser = computed(
  () => (user: UserItem) => activeUser.value?.id === user.id
)
const canRemoveMember = computed(
  () => (user: UserItem) => activeUser.value?.id !== user.id && isWorkspaceAdmin.value
)
const hasNoResults = computed(
  () =>
    (search.value.length || roleFilter.value) &&
    searchResult.value?.workspace.team.items.length === 0
)

const currentUserRole = computed<WorkspaceRoles | undefined>(() => {
  if (userToModify.value?.role && isWorkspaceRole(userToModify.value.role)) {
    return userToModify.value.role
  }
  return undefined
})

const filteredActionsItems = (user: UserItem) => {
  const baseItems: LayoutMenuItem[][] = []

  // Allow role change if the active user is an admin
  if (isWorkspaceAdmin.value && !isActiveUserCurrentUser.value(user)) {
    baseItems.push([{ title: 'Update role...', id: ActionTypes.ChangeRole }])
  }

  // Allow the current user to leave the workspace
  if (isActiveUserCurrentUser.value(user)) {
    baseItems.push([{ title: 'Leave workspace...', id: ActionTypes.LeaveWorkspace }])
  }

  // Allow removing a member if the active user is an admin and not the current user
  if (canRemoveMember.value(user)) {
    baseItems.push([{ title: 'Remove user...', id: ActionTypes.RemoveMember }])
  }

  return baseItems
}

const isWorkspaceRole = (role: string): role is WorkspaceRoles => {
  return ['workspace:admin', 'workspace:member', 'workspace:guest'].includes(role)
}

const openChangeUserRoleDialog = (user: UserItem) => {
  userToModify.value = user
  newRole.value = user.role as WorkspaceRoles
  showChangeUserRoleDialog.value = true
}

const openDeleteUserRoleDialog = (user: UserItem) => {
  userToModify.value = user
  showDeleteUserRoleDialog.value = true
}

const onUpdateRole = async (newRoleValue: WorkspaceRoles) => {
  if (!userToModify.value || !newRoleValue) return

  await updateUserRole({
    userId: userToModify.value.id,
    role: newRoleValue,
    workspaceId: props.workspaceId
  })
}

const onRemoveUser = async () => {
  if (!userToModify.value?.id) return

  await updateUserRole({
    userId: userToModify.value.id,
    role: null,
    workspaceId: props.workspaceId
  })
}

const onActionChosen = (actionItem: LayoutMenuItem, user: UserItem) => {
  userToModify.value = user

  switch (actionItem.id) {
    case ActionTypes.RemoveMember:
      openDeleteUserRoleDialog(user)
      break
    case ActionTypes.ChangeRole:
      openChangeUserRoleDialog(user)
      break
    case ActionTypes.LeaveWorkspace:
      showLeaveDialog.value = true
      break
  }
}

const toggleMenu = (itemId: string) => {
  showActionsMenu.value[itemId] = !showActionsMenu.value[itemId]
}
</script>
