<template>
  <div class="pb-24">
    <CommonAlert color="neutral" hide-icon class="mb-6 mt-2">
      <template #description>
        The guest role is meant for external collaborators. Guests can access only the
        specific projects they're invited to, and their email doesn't need to follow any
        of the allowed email domains that you may have set up. If on a Viewer seat, they
        can view projects on web and comment. If on an Editor seat, they can contribute
        to projects if given the permission. They can never create new projects.
      </template>
    </CommonAlert>
    <SettingsWorkspacesMembersTableHeader
      v-model:search="search"
      v-model:seat-type="seatTypeFilter"
      search-placeholder="Search guests..."
      :workspace="workspace"
      show-seat-filter
    />
    <LayoutTable
      class="mt-6 md:mt-8"
      :columns="[
        { id: 'name', header: 'Name', classes: 'col-span-3' },
        ...(canReadMemberEmail
          ? [{ id: 'email', header: 'Email', classes: 'col-span-3' }]
          : []),
        { id: 'seat', header: 'Seat', classes: 'col-span-1' },
        { id: 'joined', header: 'Joined', classes: 'col-span-2' },
        { id: 'projects', header: 'Projects', classes: 'col-span-2' },
        {
          id: 'actions',
          header: '',
          classes: 'col-span-1 flex items-center justify-end'
        }
      ]"
      :items="guests"
      :loading="loading"
      :empty-message="
        search.length || seatTypeFilter ? 'No results' : 'This workspace has no guests'
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
      <template #email="{ item }">
        <div class="flex">
          <span class="truncate text-body-xs text-foreground">{{ item.email }}</span>
        </div>
      </template>
      <template #seat="{ item }">
        <SettingsWorkspacesMembersTableSeatType
          :seat-type="item.seatType"
          :role="Roles.Workspace.Guest"
        />
      </template>
      <template #joined="{ item }">
        <span class="text-foreground">
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
        <div v-else class="text-foreground max-w-max text-body-2xs select-none">
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
    <InfiniteLoading
      v-if="guests?.length"
      :settings="{ identifier }"
      class="py-4"
      @infinite="onInfiniteLoad"
    />
    <SettingsWorkspacesMembersActionsProjectPermissionsDialog
      v-model:open="showProjectPermissionsDialog"
      :user="targetUser"
      :workspace-id="workspace?.id || ''"
    />
  </div>
</template>

<script setup lang="ts">
import type {
  WorkspaceSeatType,
  SettingsWorkspacesMembersActionsMenu_UserFragment
} from '~/lib/common/generated/gql/graphql'
import { Roles, type Nullable } from '@speckle/shared'
import {
  settingsWorkspacesMembersSearchQuery,
  settingsWorkspacesMembersTableQuery
} from '~~/lib/settings/graphql/queries'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'
import { useQuery } from '@vue/apollo-composable'

const props = defineProps<{
  workspaceSlug: string
}>()

const { result } = useQuery(settingsWorkspacesMembersTableQuery, () => ({
  slug: props.workspaceSlug
}))

const search = ref('')
const seatTypeFilter = ref<WorkspaceSeatType>()
const showProjectPermissionsDialog = ref(false)
const targetUser = ref<SettingsWorkspacesMembersActionsMenu_UserFragment | undefined>(
  undefined
)

const {
  identifier,
  onInfiniteLoad,
  query: { result: membersResult, loading }
} = usePaginatedQuery({
  query: settingsWorkspacesMembersSearchQuery,
  baseVariables: computed(() => ({
    query: search.value?.length ? search.value : null,
    limit: 10,
    slug: props.workspaceSlug,
    filter: {
      search: search.value,
      roles: [Roles.Workspace.Guest],
      seatType: seatTypeFilter.value
    },
    cursor: null as Nullable<string>
  })),
  resolveKey: (vars) => [vars.query || '', vars.filter?.seatType || ''],
  resolveCurrentResult: (res) => res?.workspaceBySlug.team,
  resolveNextPageVariables: (baseVars, cursor) => ({
    ...baseVars,
    cursor
  }),
  resolveCursorFromVariables: (vars) => vars.cursor
})

const workspace = computed(() => result.value?.workspaceBySlug)
const guests = computed(() => membersResult.value?.workspaceBySlug?.team?.items)

const isWorkspaceAdmin = computed(() => workspace.value?.role === Roles.Workspace.Admin)

const canReadMemberEmail = computed(
  () => workspace.value?.permissions.canReadMemberEmail.authorized
)
</script>
