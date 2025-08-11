<template>
  <div>
    <CommonAlert color="neutral" hide-icon class="mb-6 mt-2">
      <template #description>
        Workspace members can view all projects by default. If on a Viewer seat, they
        can view projects on web and comment. If on an Editor seat, they can create new
        projects in the workspace and fully contribute to other projects if given the
        permission.
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
    />
    <LayoutTable
      class="mt-6 mb-12"
      :columns="[
        { id: 'name', header: 'Name', classes: 'col-span-3' },
        { id: 'email', header: 'Email', classes: 'col-span-4' },
        { id: 'seat', header: 'Seat', classes: 'col-span-2' },
        { id: 'joined', header: 'Joined', classes: 'col-span-2' },
        {
          id: 'actions',
          header: '',
          classes: 'col-span-1 flex items-center justify-end'
        }
      ]"
      :items="members"
      :loading="isVeryFirstLoading"
      :empty-message="
        search.length || seatTypeFilter || roleFilter
          ? 'No results'
          : 'This workspace has no members'
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
            <span
              v-if="item.id === activeUser?.id"
              class="text-foreground-3 text-body-3xs"
            >
              (You)
            </span>
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
            <CircleAlert
              :size="LucideSize.lg"
              :stroke-width="1.5"
              :absolute-stroke-width="true"
              class="text-danger"
            />
          </div>
        </div>
      </template>
      <template #email="{ item }">
        <div class="flex">
          <span class="text-foreground-2 truncate">
            {{ item.email }}
          </span>
        </div>
      </template>
      <template #seat="{ item }">
        <SettingsWorkspacesMembersTableSeatType
          :seat-type="item.seatType"
          :role="Roles.Workspace.Member"
        />
      </template>
      <template #joined="{ item }">
        <span class="text-foreground-2">{{ formattedFullDate(item.joinDate) }}</span>
      </template>
      <template #actions="{ item }">
        <SettingsWorkspacesMembersActionsMenu
          :target-user="item"
          :workspace="workspace"
          :initial-action="selectedAction[item.id]"
        />
      </template>
    </LayoutTable>
    <InfiniteLoading
      v-if="members?.length"
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
import { Roles, type Nullable, type WorkspaceRoles } from '@speckle/shared'
import {
  settingsWorkspacesMembersSearchQuery,
  settingsWorkspacesMembersTableQuery
} from '~~/lib/settings/graphql/queries'
import type {
  WorkspaceSeatType,
  SettingsWorkspacesMembersActionsMenu_UserFragment
} from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~/lib/common/generated/gql'
import { CircleAlert } from 'lucide-vue-next'
import type { WorkspaceUserActionTypes } from '~/lib/settings/helpers/types'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'
import { useQuery } from '@vue/apollo-composable'

graphql(`
  fragment SettingsWorkspacesMembersTable_WorkspaceCollaborator on WorkspaceCollaborator {
    id
    email
    ...SettingsWorkspacesMembersActionsMenu_User
  }
`)

const props = defineProps<{
  workspaceSlug: string
}>()

const { activeUser } = useActiveUser()
const { result } = useQuery(settingsWorkspacesMembersTableQuery, () => ({
  slug: props.workspaceSlug
}))

const selectedAction = ref<Record<string, WorkspaceUserActionTypes>>({})
const search = ref('')
const roleFilter = ref<WorkspaceRoles>()
const seatTypeFilter = ref<WorkspaceSeatType>()
const showProjectPermissionsDialog = ref(false)
const targetUser = ref<SettingsWorkspacesMembersActionsMenu_UserFragment | undefined>(
  undefined
)

const defaultRoles = shallowRef([Roles.Workspace.Admin, Roles.Workspace.Member])

const {
  identifier,
  onInfiniteLoad,
  query: { result: membersResult },
  isVeryFirstLoading
} = usePaginatedQuery({
  query: settingsWorkspacesMembersSearchQuery,
  baseVariables: computed(() => ({
    limit: 10,
    slug: props.workspaceSlug,
    filter: {
      search: search.value,
      roles: roleFilter.value ? [roleFilter.value] : defaultRoles.value,
      seatType: seatTypeFilter.value
    },
    cursor: null as Nullable<string>
  })),
  resolveKey: (vars) => ({
    slug: vars.slug,
    filter: vars.filter
  }),
  resolveCurrentResult: (res) => res?.workspaceBySlug.team,
  resolveNextPageVariables: (baseVars, cursor) => ({
    ...baseVars,
    cursor
  }),
  resolveCursorFromVariables: (vars) => vars.cursor
})

const workspace = computed(() => result.value?.workspaceBySlug)
const members = computed(() => membersResult.value?.workspaceBySlug.team.items)
</script>
