<template>
  <div>
    <SettingsWorkspacesMembersTableHeader
      v-model:search="search"
      search-placeholder="Search pending invites..."
      :workspace-id="workspaceId"
      :workspace="workspace"
    />
    <LayoutTable
      class="mt-6 md:mt-8 mb-12"
      :columns="[
        { id: 'name', header: 'Name', classes: 'col-span-3' },
        { id: 'invitedBy', header: 'Invited by', classes: 'col-span-4' },
        { id: 'role', header: 'Role', classes: 'col-span-2' },
        { id: 'lastRemindedOn', header: 'Last reminded on', classes: 'col-span-2' },
        {
          id: 'actions',
          header: '',
          classes: 'col-span-1 flex items-center justify-end'
        }
      ]"
      :items="invites"
      :loading="searchResultLoading"
      :empty-message="
        search.length
          ? 'No invites with the specified filter found'
          : 'No pending invites'
      "
    >
      <template #name="{ item }">
        <div class="flex items-center gap-2">
          <UserAvatar v-if="item.user" hide-tooltip :user="item.user" />
          <span class="truncate text-body-xs text-foreground">{{ item.title }}</span>
        </div>
      </template>
      <template #invitedBy="{ item }">
        <div class="flex items-center gap-2">
          <UserAvatar hide-tooltip :user="item.invitedBy" />
          <span class="truncate text-body-xs text-foreground">
            {{ item.invitedBy.name }}
          </span>
        </div>
      </template>
      <template #role="{ item }">
        <span class="text-body-xs text-foreground-2">
          {{ roleDisplayName(item.role) }}
        </span>
      </template>
      <template #lastRemindedOn="{ item }">
        <span class="text-body-xs text-foreground-2">
          {{ formattedFullDate(item.updatedAt) }}
        </span>
      </template>
      <template #actions="{ item }">
        <LayoutMenu
          v-model:open="showActionsMenu[item.id]"
          :items="actionsItems"
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
  </div>
</template>

<script setup lang="ts">
import { XMarkIcon, EllipsisHorizontalIcon } from '@heroicons/vue/24/outline'
import { useQuery } from '@vue/apollo-composable'
import { capitalize } from 'lodash-es'
import { graphql } from '~/lib/common/generated/gql'
import type { SettingsWorkspacesMembersInvitesTable_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import {
  useCancelWorkspaceInvite,
  useResendWorkspaceInvite
} from '~/lib/settings/composables/workspaces'
import { settingsWorkspacesInvitesSearchQuery } from '~/lib/settings/graphql/queries'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import { HorizontalDirection } from '~~/lib/common/composables/window'

graphql(`
  fragment SettingsWorkspacesMembersInvitesTable_PendingWorkspaceCollaborator on PendingWorkspaceCollaborator {
    id
    inviteId
    role
    title
    updatedAt
    user {
      id
      ...LimitedUserAvatar
    }
    invitedBy {
      id
      ...LimitedUserAvatar
    }
  }
`)

graphql(`
  fragment SettingsWorkspacesMembersInvitesTable_Workspace on Workspace {
    id
    ...SettingsWorkspacesMembersTableHeader_Workspace
    invitedTeam(filter: $invitesFilter) {
      ...SettingsWorkspacesMembersInvitesTable_PendingWorkspaceCollaborator
    }
  }
`)

const props = defineProps<{
  workspaceId: string
  workspace?: SettingsWorkspacesMembersInvitesTable_WorkspaceFragment
}>()

const search = ref('')
const showActionsMenu = ref<Record<string, boolean>>({})

const cancelInvite = useCancelWorkspaceInvite()
const resendInvite = useResendWorkspaceInvite()
const { result: searchResult, loading: searchResultLoading } = useQuery(
  settingsWorkspacesInvitesSearchQuery,
  () => ({
    invitesFilter: {
      search: search.value
    },
    workspaceId: props.workspaceId
  }),
  () => ({
    enabled: !!search.value.length
  })
)

const invites = computed(() =>
  search.value.length
    ? searchResult.value?.workspace.invitedTeam
    : props.workspace?.invitedTeam
)

const actionsItems: LayoutMenuItem[][] = [
  [{ title: 'Resend invite', id: 'resend-invite' }],
  [{ title: 'Delete invite', id: 'delete-invite' }]
]

const onActionChosen = async (
  actionItem: LayoutMenuItem,
  item: NonNullable<typeof invites.value>[0]
) => {
  switch (actionItem.id) {
    case 'resend-invite':
      await resendInvite({
        input: {
          workspaceId: props.workspaceId,
          inviteId: item.inviteId
        }
      })
      break
    case 'delete-invite':
      await cancelInvite({
        workspaceId: props.workspaceId,
        inviteId: item.inviteId
      })
      break
  }
}

const toggleMenu = (itemId: string) => {
  showActionsMenu.value[itemId] = !showActionsMenu.value[itemId]
}

const roleDisplayName = (role: string) => capitalize(role.split(':')[1])
</script>
