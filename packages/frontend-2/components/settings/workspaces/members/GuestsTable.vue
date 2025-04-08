<template>
  <div class="pb-24">
    <CommonAlert color="neutral" hide-icon class="mb-6 mt-2">
      <template #description>
        Guests are external collaborators. They can't create or add others to workspace
        projects. Read more about
        <NuxtLink :to="LearnMoreRolesSeatsUrl" class="underline" target="_blank">
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
      <template #seat="{ item }">
        <SettingsWorkspacesMembersTableSeatType
          :seat-type="item.seatType"
          :role="Roles.Workspace.Guest"
        />
      </template>
      <template #joined="{ item }">
        <span class="text-foreground-2">
          {{ formattedFullDate(item.joinDate) }}
        </span>
      </template>
      <template #projects="{ item }">
        <FormButton
          v-if="
            item.projectRoles.length > 0 &&
            isWorkspaceAdmin &&
            item.role !== Roles.Workspace.Admin
          "
          color="subtle"
          size="sm"
          class="!font-normal !text-foreground-2 -ml-2"
          @click="
            () => {
              targetUser = item
              showProjectPermissionsDialog = true
            }
          "
        >
          {{ item.projectRoles.length }}
          {{ item.projectRoles.length === 1 ? 'project' : 'projects' }}
        </FormButton>
        <div v-else class="text-foreground-2 max-w-max text-body-2xs select-none">
          {{ item.projectRoles.length }}
          {{ item.projectRoles.length === 1 ? 'project' : 'projects' }}
        </div>
      </template>
      <template #actions="{ item }">
        <SettingsWorkspacesMembersActionsMenu
          v-if="isWorkspaceAdmin"
          :target-user="item"
          :workspace="workspace"
        />
        <span v-else />
      </template>
    </LayoutTable>
    <SettingsWorkspacesMembersActionsProjectPermissionsDialog
      v-model:open="showProjectPermissionsDialog"
      :user="targetUser"
      :workspace-id="workspace?.id || ''"
    />
  </div>
</template>

<script setup lang="ts">
import {
  WorkspaceSeatType,
  type SettingsWorkspacesMembersActionsMenu_UserFragment,
  type SettingsWorkspacesMembersTable_WorkspaceFragment
} from '~/lib/common/generated/gql/graphql'
import { Roles, type MaybeNullOrUndefined } from '@speckle/shared'
import { settingsWorkspacesMembersSearchQuery } from '~~/lib/settings/graphql/queries'
import { useQuery } from '@vue/apollo-composable'
import { LearnMoreRolesSeatsUrl } from '~~/lib/common/helpers/route'

const props = defineProps<{
  workspace: MaybeNullOrUndefined<SettingsWorkspacesMembersTable_WorkspaceFragment>
  workspaceSlug: string
}>()

const search = ref('')
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
      roles: [Roles.Workspace.Guest]
    },
    slug: props.workspaceSlug,
    workspaceId: props.workspace?.id || ''
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
    .map((g) => ({ ...g, seatType: g.seatType || WorkspaceSeatType.Viewer }))
    .filter((item) => item.role === Roles.Workspace.Guest)
    .filter((item) => !seatTypeFilter.value || item.seatType === seatTypeFilter.value)
})

const isWorkspaceAdmin = computed(() => props.workspace?.role === Roles.Workspace.Admin)
</script>
