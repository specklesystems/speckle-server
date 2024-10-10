<template>
  <section>
    <div class="md:max-w-5xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader
        hide-divider
        title="Members"
        text="Manage users in your workspace"
        class="mb-6"
      />
      <LayoutTabsHorizontal v-model:active-item="activeTab" :items="tabItems">
        <template #default="{ activeItem }">
          <SettingsWorkspacesMembersTable
            v-if="activeItem.id === 'members'"
            :workspace="workspace"
            :workspace-id="workspaceId"
          />
          <SettingsWorkspacesMembersGuestsTable
            v-if="activeItem.id === 'guests'"
            :workspace="workspace"
            :workspace-id="workspaceId"
          />
          <SettingsWorkspacesMembersInvitesTable
            v-if="activeItem.id === 'invites'"
            :workspace-id="workspaceId"
            :workspace="workspace"
          />
        </template>
      </LayoutTabsHorizontal>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Roles } from '@speckle/shared'
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import { settingsWorkspacesMembersQuery } from '~/lib/settings/graphql/queries'
import type { LayoutPageTabItem } from '~~/lib/layout/helpers/components'

graphql(`
  fragment SettingsWorkspacesMembers_Workspace on Workspace {
    id
    role
    team {
      items {
        id
        role
      }
    }
    invitedTeam(filter: $invitesFilter) {
      user {
        id
      }
    }
  }
`)

const props = defineProps<{
  workspaceId: string
}>()

const { result } = useQuery(settingsWorkspacesMembersQuery, () => ({
  workspaceId: props.workspaceId
}))

const isAdmin = computed(() => result.value?.workspace?.role === Roles.Workspace.Admin)
const workspace = computed(() => result.value?.workspace)
const memberCount = computed(
  () =>
    result.value?.workspace.team.items.filter(
      (item) => item.role !== Roles.Workspace.Guest
    ).length
)
const guestCount = computed(
  () =>
    result.value?.workspace.team.items.filter(
      (item) => item.role === Roles.Workspace.Guest
    ).length
)
const invitedCount = computed(() => result.value?.workspace.invitedTeam?.length)
const tabItems = computed<LayoutPageTabItem[]>(() => [
  { title: 'Members', id: 'members', count: memberCount.value },
  { title: 'Guests', id: 'guests', count: guestCount.value },
  {
    title: 'Pending invites',
    id: 'invites',
    disabled: !isAdmin.value,
    disabledMessage: 'Only workspace admins can manage invites',
    count: invitedCount.value
  }
])

const activeTab = ref(tabItems.value[0])
</script>
