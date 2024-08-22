<template>
  <div>
    <SettingsWorkspacesMembersTableHeader
      v-model:search="search"
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
        { id: 'role', header: 'Role', classes: 'col-span-2' }
      ]"
      :items="members"
      :loading="searchResultLoading"
      :empty-message="
        search.length
          ? `No members found for '${search}'`
          : 'This workspace has no members'
      "
      :buttons="[
        { icon: TrashIcon, label: 'Delete', action: openDeleteUserRoleDialog }
      ]"
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
        <!-- :model-value="item.role as WorkspaceRoles" -->
        <FormSelectWorkspaceRoles
          fully-control-value
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

    <SettingsSharedDeleteUserDialog
      v-model:open="showDeleteUserRoleDialog"
      :name="userToModify?.name ?? ''"
      @remove-user="onRemoveUser"
    />
  </div>
</template>

<script setup lang="ts">
import type { WorkspaceRoles } from '@speckle/shared'
import { settingsWorkspacesMembersSearchQuery } from '~~/lib/settings/graphql/queries'
import { useQuery } from '@vue/apollo-composable'
import type { SettingsWorkspacesMembersMembersTable_WorkspaceFragment } from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~/lib/common/generated/gql'
import { TrashIcon } from '@heroicons/vue/24/outline'
import { useWorkspaceUpdateRole } from '~/lib/workspaces/composables/management'

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
      items {
        id
        ...SettingsWorkspacesMembersMembersTable_WorkspaceCollaborator
      }
    }
  }
`)

const props = defineProps<{
  workspace?: SettingsWorkspacesMembersMembersTable_WorkspaceFragment
  workspaceId: string
}>()

const search = ref('')

const { result: searchResult, loading: searchResultLoading } = useQuery(
  settingsWorkspacesMembersSearchQuery,
  () => ({
    filter: {
      search: search.value
    },
    workspaceId: props.workspaceId
  }),
  () => ({
    enabled: !!search.value.length
  })
)
// const { on, bind, value: search } = useDebouncedTextInput()
const updateUserRole = useWorkspaceUpdateRole()

const showChangeUserRoleDialog = ref(false)
const showDeleteUserRoleDialog = ref(false)
const newRole = ref<WorkspaceRoles>()
const userToModify = ref<UserItem>()

const members = computed(() => {
  const memberArray = search.value.length
    ? searchResult.value?.workspace?.team.items
    : props.workspace?.team.items
  return (memberArray || []).map(({ user, ...rest }) => ({
    ...user,
    ...rest
  }))
})

const oldRole = computed(() => userToModify.value?.role as WorkspaceRoles)

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
</script>
