<template>
  <div>
    <SettingsWorkspacesMembersTableHeader
      v-model:search="search"
      search-placeholder="Search pending invites..."
    />
    <LayoutTable
      class="mt-6 md:mt-8"
      :columns="[
        { id: 'name', header: 'Name', classes: 'col-span-3' },
        { id: 'invitedBy', header: 'Invited by', classes: 'col-span-4' },
        { id: 'role', header: 'Role', classes: 'col-span-2' },
        { id: 'lastRemindedOn', header: 'Last reminded on', classes: 'col-span-3' }
      ]"
      :buttons="buttons"
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
          <UserAvatar v-if="item.user" :user="item.user" />
          <span class="truncate text-body-xs text-foreground">{{ item.title }}</span>
        </div>
      </template>
      <template #invitedBy="{ item }">
        <div class="flex items-center gap-2">
          <UserAvatar :user="item.invitedBy" />
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
          {{ formattedFullDate(item.lastRemindedAt) }}
        </span>
      </template>
    </LayoutTable>
  </div>
</template>
<script setup lang="ts">
import { EnvelopeIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { useQuery } from '@vue/apollo-composable'
import { capitalize } from 'lodash-es'
import { graphql } from '~/lib/common/generated/gql'
import type { SettingsWorkspacesMembersInvitesTable_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import { settingsWorkspacesInvitesSearchQuery } from '~/lib/settings/graphql/queries'

graphql(`
  fragment SettingsWorkspacesMembersInvitesTable_Workspace on Workspace {
    id
    invitedTeam(filter: { search: $invitesSearch }) {
      id
      role
      title
      lastRemindedAt
      user {
        id
        ...LimitedUserAvatar
      }
      invitedBy {
        id
        ...LimitedUserAvatar
      }
    }
  }
`)

const props = defineProps<{
  workspaceId: string
  workspace?: SettingsWorkspacesMembersInvitesTable_WorkspaceFragment
}>()

const search = ref('')

const { result: searchResult, loading: searchResultLoading } = useQuery(
  settingsWorkspacesInvitesSearchQuery,
  () => ({
    invitesSearch: search.value,
    workspaceId: props.workspaceId
  }),
  () => ({
    enabled: !!search.value.length
  })
)

const invites = computed(() =>
  search.value.length
    ? searchResult.value?.workspace.invitedTeam || props.workspace?.invitedTeam
    : props.workspace?.invitedTeam
)
const buttons = computed(() => [
  {
    label: 'Resend invite',
    icon: EnvelopeIcon,
    action: () => ({})
  },
  {
    label: 'Delete invite',
    icon: XMarkIcon,
    action: () => ({})
  }
])
const roleDisplayName = (role: string) => capitalize(role.split(':')[1])
</script>
