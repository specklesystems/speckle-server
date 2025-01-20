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
        <template v-if="workspace" #default="{ activeItem }">
          <SettingsWorkspacesMembersTable
            v-if="activeItem.id === 'members'"
            :workspace="workspace"
            :workspace-id="workspace.id"
          />
          <SettingsWorkspacesMembersGuestsTable
            v-if="activeItem.id === 'guests'"
            :workspace="workspace"
            :workspace-id="workspace.id"
          />
          <SettingsWorkspacesMembersInvitesTable
            v-if="activeItem.id === 'invites'"
            :workspace-id="workspace.id"
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
import { workspaceGetIdBySlugQuery } from '~~/lib/workspaces/graphql/queries'

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

definePageMeta({
  layout: 'settings'
})

useHead({
  title: 'Settings | Workspace - Members'
})

const slug = computed(() => (route.params.slug as string) || '')

const route = useRoute()
const { result: workspaceResult } = useQuery(workspaceGetIdBySlugQuery, () => ({
  slug: slug.value
}))
const workspaceId = computed(() => workspaceResult.value?.workspaceBySlug.id || '')
const { result } = useQuery(
  settingsWorkspacesMembersQuery,
  () => ({
    workspaceId: workspaceId.value
  }),
  () => ({ enabled: !!workspaceId.value })
)

const workspace = computed(() => result.value?.workspace)
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
