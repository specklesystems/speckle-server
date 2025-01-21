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
            :workspace-slug="slug"
          />
          <SettingsWorkspacesMembersGuestsTable
            v-if="activeItem.id === 'guests'"
            :workspace="workspace"
            :workspace-slug="slug"
          />
          <SettingsWorkspacesMembersInvitesTable
            v-if="activeItem.id === 'invites'"
            :workspace="workspace"
            :workspace-slug="slug"
          />
          <SettingsWorkspacesMembersJoinRequestsTable
            v-if="activeItem.id === 'joinRequests'"
            :workspace="workspace"
            :workspace-slug="slug"
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
import { WorkspaceJoinRequestStatus } from '~~/lib/common/generated/gql/graphql'

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
    adminWorkspacesJoinRequests(filter: $joinRequestsFilter) {
      totalCount
    }
  }
`)

definePageMeta({
  layout: 'settings'
})

useHead({
  title: 'Settings | Workspace - Members'
})

const slug = computed(() => (route.params.slug as string) || '')

const route = useRoute()
const { result } = useQuery(settingsWorkspacesMembersQuery, () => ({
  slug: slug.value,
  joinRequestsFilter: {
    status: WorkspaceJoinRequestStatus.Pending
  }
}))

const workspace = computed(() => result.value?.workspaceBySlug)
const isAdmin = computed(() => workspace.value?.role === Roles.Workspace.Admin)
const memberCount = computed(
  () =>
    workspace.value?.team.items.filter((item) => item.role !== Roles.Workspace.Guest)
      .length
)
const guestCount = computed(
  () =>
    workspace.value?.team.items.filter((item) => item.role === Roles.Workspace.Guest)
      .length
)
const invitedCount = computed(() => workspace.value?.invitedTeam?.length)
const joinRequestCount = computed(
  () => workspace.value?.adminWorkspacesJoinRequests?.totalCount
)
const tabItems = computed<LayoutPageTabItem[]>(() => [
  { title: 'Members', id: 'members', count: memberCount.value },
  { title: 'Guests', id: 'guests', count: guestCount.value },
  {
    title: 'Pending invites',
    id: 'invites',
    disabled: !isAdmin.value,
    disabledMessage: 'Only workspace admins can manage invites',
    count: invitedCount.value
  },
  {
    title: 'Join requests',
    id: 'joinRequests',
    disabled: !isAdmin.value,
    disabledMessage: 'Only workspace admins can manage join requests',
    count: joinRequestCount.value
  }
])

const activeTab = ref(tabItems.value[0])
</script>
