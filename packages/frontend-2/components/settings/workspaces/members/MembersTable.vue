<template>
  <div>
    <CommonAlert color="neutral" hide-icon class="mb-6 mt-2">
      <template #description>
        Workspace members can have a viewer or editor seat. Admins must be editors. Read
        more about
        <NuxtLink :to="LearnMoreRolesSeatsUrl" class="underline" target="_blank">
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
        { id: 'projects', header: 'Projects', classes: 'col-span-2' },
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
          <UserAvatar
            hide-tooltip
            :user="item.user"
            light-style
            class="bg-foundation"
            no-bg
          />
          <span class="truncate text-body-xs text-foreground">
            {{ item.user.name }}
          </span>
          <CommonBadge
            v-if="item.role === Roles.Workspace.Admin"
            rounded
            color-classes="bg-highlight-3 text-foreground-2"
          >
            Admin
          </CommonBadge>
          <div
            v-if="
              item.user.workspaceDomainPolicyCompliant === false &&
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
        <SettingsWorkspacesMembersTableSeatType :seat-type="item.seatType" />
      </template>
      <template #joined="{ item }">
        <span class="text-foreground-2">{{ formattedFullDate(item.joinDate) }}</span>
      </template>
      <template #projects="{ item }">
        <button
          v-if="
            item.projectRoles.length > 0 &&
            isWorkspaceAdmin &&
            item.role !== Roles.Workspace.Admin
          "
          class="text-foreground-2 max-w-max text-body-2xs select-none"
          @click="
            () => {
              targetUser = item
              showProjectPermissionsDialog = true
            }
          "
        >
          {{ item.projectRoles.length }} projects
        </button>
        <div v-else class="text-foreground-2 max-w-max text-body-2xs select-none">
          {{ item.projectRoles.length }} projects
        </div>
      </template>
      <template #actions="{ item }">
        <SettingsWorkspacesMembersActionsMenu
          :target-user="item"
          :workspace="workspace"
          :initial-action="selectedAction[item.id]"
        />
      </template>
    </LayoutTable>
    <SettingsWorkspacesMembersActionsProjectPermissionsDialog
      v-model:open="showProjectPermissionsDialog"
      :user="targetUser"
      :workspace-id="workspace?.id || ''"
      @success="showProjectPermissionsDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { Roles, type WorkspaceRoles, type MaybeNullOrUndefined } from '@speckle/shared'
import { settingsWorkspacesMembersSearchQuery } from '~~/lib/settings/graphql/queries'
import { useQuery } from '@vue/apollo-composable'
import {
  WorkspaceSeatType,
  type SettingsWorkspacesMembersTable_WorkspaceFragment,
  type SettingsWorkspacesMembersActionsMenu_UserFragment
} from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~/lib/common/generated/gql'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import { LearnMoreRolesSeatsUrl } from '~~/lib/common/helpers/route'
import type { WorkspaceUserActionTypes } from '~/lib/settings/helpers/types'

graphql(`
  fragment SettingsWorkspacesMembersTable_WorkspaceCollaborator on WorkspaceCollaborator {
    id
    projectRoles {
      project {
        id
      }
    }
    ...SettingsWorkspacesMembersActionsMenu_User
  }
`)

graphql(`
  fragment SettingsWorkspacesMembersTable_Workspace on Workspace {
    id
    slug
    name
    ...SettingsSharedDeleteUserDialog_Workspace
    ...SettingsWorkspacesMembersTableHeader_Workspace
    team(limit: 250) {
      items {
        id
        ...SettingsWorkspacesMembersTable_WorkspaceCollaborator
      }
    }
  }
`)

const props = defineProps<{
  workspace: MaybeNullOrUndefined<SettingsWorkspacesMembersTable_WorkspaceFragment>
  workspaceSlug: string
}>()

const search = ref('')
const roleFilter = ref<WorkspaceRoles>()
const seatTypeFilter = ref<WorkspaceSeatType>()
const showProjectPermissionsDialog = ref(false)
const targetUser = ref<SettingsWorkspacesMembersActionsMenu_UserFragment | undefined>(
  undefined
)

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
    slug: props.workspaceSlug,
    workspaceId: props.workspace?.id || ''
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
    .map((member) => ({
      ...member,
      seatType: member.seatType || WorkspaceSeatType.Viewer
    }))
    .filter((user) => user.role !== Roles.Workspace.Guest)
})

const hasNoResults = computed(
  () =>
    (search.value.length || roleFilter.value || seatTypeFilter.value) &&
    searchResult.value?.workspaceBySlug?.team.items.length === 0
)

const isWorkspaceAdmin = computed(() => props.workspace?.role === Roles.Workspace.Admin)

const selectedAction = ref<Record<string, WorkspaceUserActionTypes>>({})
</script>
