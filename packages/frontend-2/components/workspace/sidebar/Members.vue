<template>
  <div class="lg:px-4 lg:py-2">
    <LayoutSidebarMenuGroup
      :title="collapsible ? 'Members' : undefined"
      :collapsible="collapsible"
      :icon="iconName"
      :icon-click="iconClick"
      :icon-text="iconText"
      no-hover
    >
      <div
        class="flex lg:flex-col items-center lg:items-start gap-y-3 pb-0 lg:pb-4 mt-1"
      >
        <div class="flex gap-y-3 flex-col w-full">
          <UserAvatarGroup
            v-if="workspace?.sidebarTeam && team.length > 0"
            :overlap="false"
            :users="team.map((teamMember) => teamMember.user)"
            :max-avatars="4"
            class="shrink-0"
            :on-hidden-count-click="
              () => {
                navigateTo(settingsWorkspaceRoutes.members.route(workspace?.slug || ''))
              }
            "
          />

          <div
            v-if="
              workspace?.sidebarTeam &&
              isWorkspaceAdmin &&
              (adminWorkspacesJoinRequestsCount || invitedTeamCount)
            "
            class="w-full flex items-center gap-x-2"
          >
            <button
              v-if="adminWorkspacesJoinRequestsCount"
              class="hidden md:flex items-center shrink-0 justify-center text-body-3xs px-2 h-8 rounded-full border border-dashed border-outline-2 hover:bg-foundation select-none"
              @click="
                navigateTo(
                  settingsWorkspaceRoutes.membersRequests.route(workspace?.slug || '')
                )
              "
            >
              {{ adminWorkspacesJoinRequestsCount }} join
              {{ adminWorkspacesJoinRequestsCount > 1 ? 'requests' : 'request' }}
            </button>
            <button
              v-if="invitedTeamCount"
              class="hidden md:flex items-center shrink-0 justify-center text-body-3xs px-2 h-8 rounded-full border border-dashed border-outline-2 hover:bg-foundation select-none"
              @click="
                navigateTo(
                  settingsWorkspaceRoutes.membersInvites.route(workspace?.slug || '')
                )
              "
            >
              {{ invitedTeamCount }} pending
            </button>
          </div>
        </div>
        <FormButton
          v-if="workspace?.sidebarTeam && isWorkspaceAdmin"
          color="outline"
          size="sm"
          @click="showInviteDialog = true"
        >
          Invite your team
        </FormButton>
      </div>
    </LayoutSidebarMenuGroup>
    <InviteDialogWorkspace v-model:open="showInviteDialog" :workspace="workspace" />
  </div>
</template>

<script setup lang="ts">
import {
  type WorkspaceSidebarMembers_WorkspaceFragment,
  WorkspaceJoinRequestStatus
} from '~/lib/common/generated/gql/graphql'
import { settingsWorkspaceRoutes } from '~/lib/common/helpers/route'
import { graphql } from '~~/lib/common/generated/gql'
import type { MaybeNullOrUndefined } from '@speckle/shared'

graphql(`
  fragment WorkspaceSidebarMembers_Workspace on Workspace {
    id
    slug
    name
    domainBasedMembershipProtectionEnabled
    defaultSeatType
    sidebarTeam: team(limit: 6) {
      totalCount
      items {
        id
        user {
          id
          name
          avatar
        }
      }
    }
    invitedTeam(filter: $invitesFilter) {
      id
      role
    }
    adminWorkspacesJoinRequests {
      totalCount
      items {
        status
        id
      }
    }
  }
`)

const props = defineProps<{
  workspace: MaybeNullOrUndefined<WorkspaceSidebarMembers_WorkspaceFragment>
  collapsible?: boolean
  isWorkspaceAdmin?: boolean
  isWorkspaceGuest?: boolean
}>()

const showInviteDialog = ref(false)

const team = computed(() => props.workspace?.sidebarTeam.items || [])

const iconName = computed(() => (props.isWorkspaceAdmin ? 'edit' : 'view'))

const iconClick = computed(() => {
  if (props.isWorkspaceGuest) return undefined
  return () =>
    navigateTo(settingsWorkspaceRoutes.members.route(props.workspace?.slug || ''))
})

const iconText = computed(() => {
  if (props.isWorkspaceAdmin) return 'Manage members'
  return 'View members'
})

const invitedTeamCount = computed(() => props.workspace?.invitedTeam?.length ?? 0)

const adminWorkspacesJoinRequestsCount = computed(
  () =>
    props.workspace?.adminWorkspacesJoinRequests?.items.filter(
      (request) => request.status === WorkspaceJoinRequestStatus.Pending
    ).length
)
</script>
