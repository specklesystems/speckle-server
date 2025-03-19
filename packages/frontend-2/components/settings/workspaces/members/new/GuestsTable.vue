<template>
  <div>
    <CommonAlert color="neutral" hide-icon class="mb-6 mt-2">
      <template #description>
        Guests are external collaborators. They can't create or add others to workspace
        projects. Read more about
        <!-- TODO: Add link to roles and seats page -->
        <NuxtLink :to="LEARN_MORE_ROLES_SEATS_URL" class="underline">
          Speckle roles and seats.
        </NuxtLink>
      </template>
    </CommonAlert>
    <SettingsWorkspacesMembersTableHeader
      v-model:search="search"
      v-model:seat-type="seatTypeFilter"
      search-placeholder="Search guests..."
      :workspace="workspace"
      show-invite-button
      show-seat-filter
    />
    <LayoutTable
      class="mt-6 md:mt-8"
      :columns="[
        { id: 'name', header: 'Name', classes: 'col-span-3' },
        { id: 'email', header: 'Email', classes: 'col-span-3' },
        { id: 'seat', header: 'Seat', classes: 'col-span-2' },
        { id: 'joined', header: 'Joined', classes: 'col-span-3' },
        {
          id: 'actions',
          header: '',
          classes: 'col-span-1 flex items-center justify-end'
        }
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
        </div>
      </template>
      <!-- TODO: Add email -->
      <template #email="">
        <span class="text-body-xs text-foreground">EMAIL</span>
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
          v-if="isWorkspaceAdmin"
          :target-user="{
            ...item.user,
            role: item.role,
            seatType: item.seatType
          }"
          :workspace-role="workspace?.role"
          :workspace-id="workspace?.id"
        />
        <span v-else />
      </template>
    </LayoutTable>
  </div>
</template>

<script setup lang="ts">
import type {
  SettingsWorkspacesMembersNewGuestsTable_WorkspaceFragment,
  WorkspaceCollaborator
} from '~/lib/common/generated/gql/graphql'
import { graphql } from '~/lib/common/generated/gql'
import { Roles, type MaybeNullOrUndefined } from '@speckle/shared'
import { settingsWorkspacesMembersSearchQuery } from '~~/lib/settings/graphql/queries'
import { useQuery } from '@vue/apollo-composable'
import { LEARN_MORE_ROLES_SEATS_URL } from '~/lib/settings/helpers/constants'
import SeatTypeDisplay from '../SeatTypeDisplay.vue'
graphql(`
  fragment SettingsWorkspacesMembersNewGuestsTable_WorkspaceCollaborator on WorkspaceCollaborator {
    id
    role
    seatType
    user {
      id
      avatar
      name
    }
    projectRoles {
      role
      project {
        id
        name
      }
    }
  }
`)

graphql(`
  fragment SettingsWorkspacesMembersNewGuestsTable_Workspace on Workspace {
    id
    ...SettingsWorkspacesMembersTableHeader_Workspace
    ...SettingsSharedDeleteUserDialog_Workspace
    team {
      items {
        id
        ...SettingsWorkspacesMembersNewGuestsTable_WorkspaceCollaborator
      }
    }
  }
`)

const props = defineProps<{
  workspace: MaybeNullOrUndefined<SettingsWorkspacesMembersNewGuestsTable_WorkspaceFragment>
  workspaceSlug: string
}>()

const search = ref('')
const seatTypeFilter = ref<string>()

const { result: searchResult, loading: searchResultLoading } = useQuery(
  settingsWorkspacesMembersSearchQuery,
  () => ({
    filter: {
      search: search.value,
      roles: [Roles.Workspace.Guest]
    },
    slug: props.workspaceSlug
  }),
  () => ({
    enabled: !!search.value.length || !!seatTypeFilter.value
  })
)

const guests = computed(() => {
  const guestArray =
    search.value.length || seatTypeFilter.value
      ? searchResult.value?.workspaceBySlug?.team.items
      : props.workspace?.team.items

  return (guestArray || [])
    .filter(
      (item): item is WorkspaceCollaborator => item.role === Roles.Workspace.Guest
    )
    .filter((item) => !seatTypeFilter.value || item.seatType === seatTypeFilter.value)
})

const isWorkspaceAdmin = computed(() => props.workspace?.role === Roles.Workspace.Admin)
</script>
