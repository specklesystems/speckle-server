<template>
  <div>
    <SettingsWorkspacesMembersTableHeader
      v-model:search="search"
      search-placeholder="Search guests..."
      :workspace-id="workspaceId"
      :workspace="workspace"
    />
    <LayoutTable
      class="mt-6 md:mt-8"
      :columns="[
        { id: 'name', header: 'Name', classes: 'col-span-4' },
        { id: 'company', header: 'Company', classes: 'col-span-4' },
        { id: 'verified', header: 'Status', classes: 'col-span-3' },
        { id: 'actions', header: '', classes: 'col-span-1 flex justify-end' }
      ]"
      :items="guests"
      :loading="searchResultLoading"
      :empty-message="
        search.length
          ? `No guests found for '${search}'`
          : 'This workspace has no guests'
      "
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
      <template #actions="{ item }">
        <LayoutMenu
          v-if="isWorkspaceAdmin"
          v-model:open="showActionsMenu[item.id]"
          :items="actionItems"
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
      </template>
    </LayoutTable>

    <!-- Delete User Dialog -->
    <SettingsSharedDeleteUserDialog
      v-model:open="showDeleteUserRoleDialog"
      :name="userToModify?.name ?? ''"
      @remove-user="onRemoveUser"
    />
  </div>
</template>

<script setup lang="ts">
import type { SettingsWorkspacesMembersMembersTable_WorkspaceFragment } from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~/lib/common/generated/gql'
import { Roles } from '@speckle/shared'
import { settingsWorkspacesMembersSearchQuery } from '~~/lib/settings/graphql/queries'
import { useQuery } from '@vue/apollo-composable'
import { useMixpanel } from '~/lib/core/composables/mp'
import { useWorkspaceUpdateRole } from '~/lib/workspaces/composables/management'
import { HorizontalDirection } from '~~/lib/common/composables/window'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import { EllipsisHorizontalIcon, XMarkIcon } from '@heroicons/vue/24/outline'

graphql(`
  fragment SettingsWorkspacesMembersGuestsTable_WorkspaceCollaborator on WorkspaceCollaborator {
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
  fragment SettingsWorkspacesMembersGuestsTable_Workspace on Workspace {
    id
    ...SettingsWorkspacesMembersTableHeader_Workspace
    team {
      items {
        id
        ...SettingsWorkspacesMembersGuestsTable_WorkspaceCollaborator
      }
    }
  }
`)

enum ActionTypes {
  RemoveMember = 'remove-member'
}

type UserItem = (typeof guests)['value'][0]

const props = defineProps<{
  workspace?: SettingsWorkspacesMembersMembersTable_WorkspaceFragment
  workspaceId: string
}>()

const search = ref('')
const showActionsMenu = ref<Record<string, boolean>>({})
const showDeleteUserRoleDialog = ref(false)
const userToModify = ref<UserItem>()

const mixpanel = useMixpanel()
const updateUserRole = useWorkspaceUpdateRole()

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

const guests = computed(() => {
  const guestArray = search.value.length
    ? searchResult.value?.workspace?.team.items
    : props.workspace?.team.items

  return (guestArray || [])
    .filter(({ role }) => role === Roles.Workspace.Guest)
    .map(({ user, ...rest }) => ({
      ...user,
      ...rest
    }))
})

const isWorkspaceAdmin = computed(() => props.workspace?.role === Roles.Workspace.Admin)

const actionItems: LayoutMenuItem[][] = [
  [{ title: 'Remove member', id: ActionTypes.RemoveMember }]
]

const onActionChosen = (actionItem: LayoutMenuItem, user: UserItem) => {
  userToModify.value = user

  if (actionItem.id === ActionTypes.RemoveMember) {
    openDeleteUserRoleDialog(user)
  }
}

const openDeleteUserRoleDialog = (user: UserItem) => {
  userToModify.value = user
  showDeleteUserRoleDialog.value = true
}

const onRemoveUser = async () => {
  if (!userToModify.value?.id) return

  await updateUserRole({
    userId: userToModify.value.id,
    role: null,
    workspaceId: props.workspaceId
  })

  mixpanel.track('Workspace User Removed', {
    // eslint-disable-next-line camelcase
    workspace_id: props.workspaceId
  })
}

const toggleMenu = (itemId: string) => {
  showActionsMenu.value[itemId] = !showActionsMenu.value[itemId]
}
</script>
