<template>
  <section>
    <div class="md:max-w-5xl md:mx-auto pb-16">
      <SettingsSectionHeader
        hide-divider
        title="People"
        text="Manage users in your workspace"
        class="mb-6"
      />
      <LayoutTabsHorizontal v-model:active-item="activeTab" :items="tabItems">
        <NuxtPage />
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
import { useOnWorkspaceUpdated } from '~/lib/workspaces/composables/management'
import { settingsWorkspaceRoutes } from '~/lib/common/helpers/route'
import { WorkspaceJoinRequestStatus } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment SettingsWorkspacesMembersCounts_Workspace on Workspace {
    id
    role
    invitedTeam {
      id
    }
    teamByRole {
      admins {
        totalCount
      }
      members {
        totalCount
      }
      guests {
        totalCount
      }
    }
    adminWorkspacesJoinRequests(filter: $filter) {
      totalCount
    }
  }
`)

definePageMeta({
  middleware: ['require-valid-workspace'],
  layout: 'settings'
})

useHead({
  title: 'Settings | Workspace - Members'
})

const route = useRoute()
const router = useRouter()
const slug = computed(() => (route.params.slug as string) || '')

const { result } = useQuery(settingsWorkspacesMembersQuery, () => ({
  slug: slug.value,
  filter: {
    status: WorkspaceJoinRequestStatus.Pending
  }
}))

const workspace = computed(() => result.value?.workspaceBySlug)
const isAdmin = computed(() => workspace.value?.role === Roles.Workspace.Admin)

const memberTotalCount = computed(
  () =>
    (workspace.value?.teamByRole.members?.totalCount ?? 0) +
    (workspace.value?.teamByRole.admins?.totalCount ?? 0)
)
const guestTotalCount = computed(
  () => workspace.value?.teamByRole.guests?.totalCount ?? 0
)
const invitedCount = computed(() => workspace.value?.invitedTeam?.length)
const joinRequestCount = computed(
  () => workspace.value?.adminWorkspacesJoinRequests?.totalCount
)

const tabItems = computed<LayoutPageTabItem[]>(() => [
  { title: 'Members', id: 'members', count: memberTotalCount.value },
  { title: 'Guests', id: 'guests', count: guestTotalCount.value },
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

const activeTab = computed({
  get: () => {
    const path = route.path
    if (path.includes('/members/guests')) return tabItems.value[1]
    if (path.includes('/members/invites')) return tabItems.value[2]
    if (path.includes('/members/requests')) return tabItems.value[3]
    if (path.includes('/members')) return tabItems.value[0]
    return tabItems.value[0]
  },
  set: (val: LayoutPageTabItem) => {
    switch (val.id) {
      case 'members':
        router.push(settingsWorkspaceRoutes.members.route(slug.value))
        break
      case 'guests':
        router.push(settingsWorkspaceRoutes.membersGuests.route(slug.value))
        break
      case 'invites':
        router.push(settingsWorkspaceRoutes.membersInvites.route(slug.value))
        break
      case 'joinRequests':
        router.push(settingsWorkspaceRoutes.membersRequests.route(slug.value))
        break
    }
  }
})

useOnWorkspaceUpdated({ workspaceSlug: slug })
</script>
