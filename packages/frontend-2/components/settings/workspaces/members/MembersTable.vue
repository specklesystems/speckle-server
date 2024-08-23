<template>
  <div>
    <SettingsWorkspacesMembersTableHeader
      search-placeholder="Search members..."
      :workspace-id="workspaceId"
      :workspace="workspace"
    />
    <LayoutTable
      class="mt-6 md:mt-8"
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
    >
      <template #name="{ item }">
        <div class="flex items-center gap-2">
          <UserAvatar :user="item" />
          <span class="truncate text-body-xs text-foreground">{{ item.name }}</span>
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
        <FormSelectWorkspaceRoles
          :model-value="item.role as WorkspaceRoles"
          fully-control-value
          @update:model-value="
            (newRoleValue) => openChangeUserRoleDialog(item, newRoleValue)
          "
        />
      </template>
      <template #actions="{ item }">
        <LayoutMenu
          v-model:open="showActionsMenu"
          :items="actionsItems"
          mount-menu-on-body
          :menu-position="HorizontalDirection.Left"
          @chosen="({ item: actionItem }) => onActionChosen(actionItem, item)"
        >
          <FormButton
            color="subtle"
            hide-text
            :icon-right="EllipsisHorizontalIcon"
            @click="showActionsMenu = !showActionsMenu"
          />
        </LayoutMenu>
      </template>
    </LayoutTable>

    <SettingsSharedChangeRoleDialog
      v-model:open="showChangeUserRoleDialog"
      :name="userToModify?.name ?? ''"
      :old-role="oldRole"
      :new-role="newRole"
      @update-role="onUpdateRole"
    />

    <SettingsSharedDeleteUserDialog
      v-model:open="showDeleteUserRoleDialog"
      :name="userToModify?.name ?? ''"
      @remove-user="onRemoveUser"
    />
  </div>
</template>

<script setup lang="ts">
import type { WorkspaceRoles } from '@speckle/shared'
import type { SettingsWorkspacesMembersMembersTable_WorkspaceFragment } from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~/lib/common/generated/gql'
import { EllipsisHorizontalIcon } from '@heroicons/vue/24/outline'
import { useWorkspaceUpdateRole } from '~/lib/workspaces/composables/management'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import { HorizontalDirection } from '~~/lib/common/composables/window'

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
    }
  }
`)

graphql(`
  fragment SettingsWorkspacesMembersMembersTable_Workspace on Workspace {
    id
    ...SettingsWorkspacesMembersTableHeader_Workspace
    team {
      id
      ...SettingsWorkspacesMembersMembersTable_WorkspaceCollaborator
    }
  }
`)

enum ActionTypes {
  RemoveMember = 'remove-member',
  LeaveWorkspace = 'leave-workspace'
}

const props = defineProps<{
  workspace?: SettingsWorkspacesMembersMembersTable_WorkspaceFragment
  workspaceId: string
}>()

// const { on, bind, value: search } = useDebouncedTextInput()
const updateUserRole = useWorkspaceUpdateRole()

const showChangeUserRoleDialog = ref(false)
const showDeleteUserRoleDialog = ref(false)
const newRole = ref<WorkspaceRoles>()
const userToModify = ref<UserItem>()
const showActionsMenu = ref(false)

const members = computed(() =>
  (props.workspace?.team || []).map(({ user, ...rest }) => ({
    ...user,
    ...rest
  }))
)

const oldRole = computed(() => userToModify.value?.role as WorkspaceRoles)

const actionsItems: LayoutMenuItem[][] = [
  [{ title: 'Remove member...', id: ActionTypes.RemoveMember }],
  [{ title: 'Leave workspace', id: ActionTypes.LeaveWorkspace }]
]

const openChangeUserRoleDialog = (
  user: UserItem,
  newRoleValue?: WorkspaceRoles | WorkspaceRoles[]
) => {
  if (!newRoleValue) return
  userToModify.value = user
  newRole.value = Array.isArray(newRoleValue) ? newRoleValue[0] : newRoleValue
  showChangeUserRoleDialog.value = true
}

const openDeleteUserRoleDialog = (user: UserItem) => {
  userToModify.value = user
  showDeleteUserRoleDialog.value = true
}

const onUpdateRole = async () => {
  if (!userToModify.value || !newRole.value) return

  await updateUserRole({
    userId: userToModify.value.id,
    role: newRole.value,
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
    // case ActionTypes.LeaveWorkspace:
    //   console.log('leave', user)
    //   break
  }
}
</script>
