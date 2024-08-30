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
        { id: 'name', header: 'Name', classes: 'col-span-3' },
        { id: 'company', header: 'Company', classes: 'col-span-3' },
        { id: 'verified', header: 'Status', classes: 'col-span-3' }
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
    </LayoutTable>
  </div>
</template>

<script setup lang="ts">
import type { SettingsWorkspacesMembersMembersTable_WorkspaceFragment } from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~/lib/common/generated/gql'
import { Roles } from '@speckle/shared'
import { settingsWorkspacesMembersSearchQuery } from '~~/lib/settings/graphql/queries'
import { useQuery } from '@vue/apollo-composable'

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
</script>
