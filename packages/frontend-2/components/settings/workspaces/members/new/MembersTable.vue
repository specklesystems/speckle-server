<template>
  <div>
    <CommonAlert color="neutral" hide-icon class="mb-6 mt-2">
      <template #description>
        Workspace members can have a viewer or editor seat. Admins must be editors. Read
        more about
        <NuxtLink :to="LearnMoreRolesSeatsUrl" class="underline">
          Speckle roles and seats.
        </NuxtLink>
      </template>
    </CommonAlert>
    <SettingsWorkspacesMembersTableHeader
      v-model:search="search"
      v-model:role="roleFilter"
      v-model:seat-type="seatTypeFilter"
      search-placeholder="Search members..."
      :workspace="workspace"
      show-role-filter
      show-seat-filter
      show-invite-button
    />
    <LayoutTable
      class="mt-6 mb-12"
      :columns="[
        { id: 'name', header: 'Name', classes: 'col-span-4' },
        { id: 'seat', header: 'Seat', classes: 'col-span-2' },
        { id: 'joined', header: 'Joined', classes: 'col-span-3' },
        {
          id: 'actions',
          header: '',
          classes: 'col-span-3 flex items-center justify-end'
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
          <UserAvatar
            hide-tooltip
            :user="item"
            light-style
            class="bg-foundation"
            no-bg
          />
          <span class="truncate text-body-xs text-foreground">{{ item.name }}</span>
          <CommonBadge
            v-if="item.role === Roles.Workspace.Admin"
            rounded
            color-classes="bg-highlight-3 text-foreground-2"
          >
            Admin
          </CommonBadge>
          <div
            v-if="
              item.workspaceDomainPolicyCompliant === false &&
              item.role !== Roles.Workspace.Guest
            "
            v-tippy="
              'This user does not comply with the domain policy set on this workspace'
            "
          >
            <ExclamationCircleIcon class="text-danger w-5" />
          </div>
        </div>
      </template>
      <template #seat="{ item }">
        <SeatTypeDisplay :seat-type="item.seatType" />
      </template>
      <!-- TODO: Add joined at date -->
      <template #joined="">
        <span class="text-foreground-2">JOINED AT</span>
      </template>
      <template #actions="{ item }">
        <SettingsWorkspacesMembersUpdateActionsMenu
          :target-user="item"
          :workspace-role="workspace?.role"
          :workspace-id="workspace?.id"
        />
      </template>
    </LayoutTable>
  </div>
</template>

<script setup lang="ts">
import { Roles, type WorkspaceRoles, type MaybeNullOrUndefined } from '@speckle/shared'
import { settingsWorkspacesMembersSearchQuery } from '~~/lib/settings/graphql/queries'
import { useQuery } from '@vue/apollo-composable'
import type { SettingsWorkspacesNewMembersTable_WorkspaceFragment } from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~/lib/common/generated/gql'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import { LearnMoreRolesSeatsUrl } from '~/lib/settings/helpers/constants'
import SeatTypeDisplay from '../SeatTypeDisplay.vue'

export type UserItem = (typeof members)['value'][0]

graphql(`
  fragment SettingsWorkspacesNewMembersTable_WorkspaceCollaborator on WorkspaceCollaborator {
    id
    role
    seatType
    user {
      id
      avatar
      name
      workspaceDomainPolicyCompliant
    }
  }
`)

graphql(`
  fragment SettingsWorkspacesNewMembersTable_Workspace on Workspace {
    id
    name
    ...SettingsSharedDeleteUserDialog_Workspace
    ...SettingsWorkspacesMembersTableHeader_Workspace
    team {
      items {
        id
        ...SettingsWorkspacesNewMembersTable_WorkspaceCollaborator
      }
    }
  }
`)

const props = defineProps<{
  workspace: MaybeNullOrUndefined<SettingsWorkspacesNewMembersTable_WorkspaceFragment>
  workspaceSlug: string
}>()

const search = ref('')
const roleFilter = ref<WorkspaceRoles>()
const seatTypeFilter = ref<string>()

const { result: searchResult, loading: searchResultLoading } = useQuery(
  settingsWorkspacesMembersSearchQuery,
  () => ({
    filter: {
      search: search.value,
      roles: roleFilter.value
        ? [roleFilter.value]
        : [Roles.Workspace.Admin, Roles.Workspace.Member],
      seatType: seatTypeFilter.value
    },
    slug: props.workspaceSlug
  }),
  () => ({
    enabled: !!search.value.length || !!roleFilter.value || !!seatTypeFilter.value
  })
)

const members = computed(() => {
  const memberArray =
    search.value.length || roleFilter.value || seatTypeFilter.value
      ? searchResult.value?.workspaceBySlug?.team.items
      : props.workspace?.team.items
  return (memberArray || [])
    .map(({ user, seatType, ...rest }) => ({
      ...user,
      seatType,
      ...rest
    }))
    .filter((user) => user.role !== Roles.Workspace.Guest)
})

const hasNoResults = computed(
  () =>
    (search.value.length || roleFilter.value || seatTypeFilter.value) &&
    searchResult.value?.workspaceBySlug?.team.items.length === 0
)
</script>
