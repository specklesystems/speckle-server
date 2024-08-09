<template>
  <div>
    <SettingsWorkspacesMembersTableHeader
      search-placeholder="Search members..."
      :workspace-id="workspaceId"
    />
    <LayoutTable
      class="mt-6 md:mt-8"
      :columns="[
        { id: 'name', header: 'Name', classes: 'col-span-3' },
        { id: 'company', header: 'Company', classes: 'col-span-3' },
        { id: 'verified', header: 'Status', classes: 'col-span-3' },
        { id: 'role', header: 'Role', classes: 'col-span-2' }
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
          :disabled="!isCurrentUser(item.id)"
          @update:model-value="
            (newRoleValue) => openChangeUserRoleDialog(item, newRoleValue)
          "
        />
      </template>
    </LayoutTable>

    <SettingsSharedChangeRoleDialog
      v-model:open="showChangeUserRoleDialog"
      :name="userToModify?.name ?? ''"
      :old-role="oldRole"
      :new-role="newRole"
      @update-role="onUpdateRole"
    />
  </div>
</template>

<script setup lang="ts">
// Todo: Enable searching once supported
import type { WorkspaceRoles } from '@speckle/shared'
import { workspaceUpdateRoleMutation } from '~~/lib/workspaces/graphql/mutations'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { useMutation } from '@vue/apollo-composable'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import type { SettingsWorkspacesMembersMembersTable_WorkspaceFragment } from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~/lib/common/generated/gql'

type UserItem = (typeof members)['value'][0]

graphql(`
  fragment SettingsWorkspacesMembersMembersTable_Workspace on Workspace {
    id
    team {
      role
      id
      user {
        id
        avatar
        name
        company
        verified
      }
    }
  }
`)

const props = defineProps<{
  workspace?: SettingsWorkspacesMembersMembersTable_WorkspaceFragment
  workspaceId: string
}>()

const { triggerNotification } = useGlobalToast()
// const { on, bind, value: search } = useDebouncedTextInput()
const { activeUser } = useActiveUser()
const { mutate: updateChangeRole } = useMutation(workspaceUpdateRoleMutation)

const showChangeUserRoleDialog = ref(false)
const newRole = ref<WorkspaceRoles>()
const userToModify = ref<UserItem>()

const members = computed(() =>
  (props.workspace?.team || []).map(({ user, ...rest }) => ({
    ...user,
    ...rest
  }))
)

const oldRole = computed(() => userToModify.value?.role as WorkspaceRoles)
const isCurrentUser = (id: string) => id === activeUser.value?.id

const openChangeUserRoleDialog = (
  user: UserItem,
  newRoleValue?: WorkspaceRoles | WorkspaceRoles[]
) => {
  if (!newRoleValue) return
  userToModify.value = user
  newRole.value = Array.isArray(newRoleValue) ? newRoleValue[0] : newRoleValue
  showChangeUserRoleDialog.value = true
}

const onUpdateRole = async () => {
  if (!userToModify.value || !newRole.value) return

  const mutationResult = await updateChangeRole({
    input: {
      userId: userToModify.value.id,
      role: newRole.value,
      workspaceId: props.workspaceId
    }
  }).catch(convertThrowIntoFetchResult)

  if (mutationResult?.data?.workspaceMutations?.updateRole) {
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'User role updated',
      description: 'The user role has been updated'
    })
  } else {
    const errorMessage = getFirstErrorMessage(mutationResult?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to update role',
      description: errorMessage
    })
  }
}
</script>
