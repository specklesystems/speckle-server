<template>
  <LayoutSidebarMenuGroup
    :title="collapsible ? 'Members' : undefined"
    :collapsible="collapsible"
    :icon="iconName"
    :icon-click="iconClick"
    :icon-text="iconText"
    :tag="workspaceInfo.team.totalCount.toString() || undefined"
    no-hover
  >
    <div class="flex lg:flex-col items-center lg:items-start gap-y-3 pb-0 lg:pb-4 mt-1">
      <div class="flex gap-y-3 flex-col w-full">
        <UserAvatarGroup
          :overlap="false"
          :users="team.map((teamMember) => teamMember.user)"
          :max-avatars="isDesktop ? 5 : 3"
          class="shrink-0"
        />
        <div class="w-full flex items-center gap-x-2">
          <button
            v-if="adminWorkspacesJoinRequestsCount && isWorkspaceAdmin"
            class="hidden md:flex items-center shrink-0 justify-center text-body-3xs px-2 h-8 rounded-full border border-dashed border-outline-2 hover:bg-foundation select-none"
            @click="
              navigateTo(settingsWorkspaceRoutes.members.route(workspaceInfo.slug))
            "
          >
            {{ adminWorkspacesJoinRequestsCount }} join
            {{ adminWorkspacesJoinRequestsCount > 1 ? 'requests' : 'request' }}
          </button>
          <button
            v-if="invitedTeamCount && isWorkspaceAdmin"
            class="hidden md:flex items-center shrink-0 justify-center text-body-3xs px-2 h-8 rounded-full border border-dashed border-outline-2 hover:bg-foundation select-none"
            @click="
              navigateTo(settingsWorkspaceRoutes.members.route(workspaceInfo.slug))
            "
          >
            {{ invitedTeamCount }} pending
          </button>
        </div>
      </div>
      <FormButton
        v-if="isWorkspaceAdmin"
        color="outline"
        size="sm"
        @click="$emit('show-invite-dialog')"
      >
        Invite your team
      </FormButton>
    </div>
  </LayoutSidebarMenuGroup>
</template>
<script setup lang="ts">
import {
  type WorkspaceTeam_WorkspaceFragment,
  WorkspaceJoinRequestStatus
} from '~/lib/common/generated/gql/graphql'
import { settingsWorkspaceRoutes } from '~/lib/common/helpers/route'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'
import { useBreakpoints } from '@vueuse/core'

defineEmits<{
  (e: 'show-invite-dialog'): void
}>()

const props = defineProps<{
  workspaceInfo: WorkspaceTeam_WorkspaceFragment
  collapsible?: boolean
  isWorkspaceAdmin?: boolean
}>()

const breakpoints = useBreakpoints(TailwindBreakpoints)
const isDesktop = breakpoints.greaterOrEqual('lg')

const team = computed(() => props.workspaceInfo.team.items || [])

const iconName = computed(() => {
  if (!props.isWorkspaceAdmin) return undefined
  return 'edit'
})

const iconClick = computed(() => {
  if (!props.isWorkspaceAdmin) return undefined
  return () =>
    navigateTo(settingsWorkspaceRoutes.members.route(props.workspaceInfo.slug))
})

const iconText = computed(() => {
  if (!props.isWorkspaceAdmin) return undefined
  return 'Manage members'
})

const invitedTeamCount = computed(() => props.workspaceInfo?.invitedTeam?.length ?? 0)
const adminWorkspacesJoinRequestsCount = computed(
  () =>
    props.workspaceInfo?.adminWorkspacesJoinRequests?.items.filter(
      (request) => request.status === WorkspaceJoinRequestStatus.Pending
    ).length
)
</script>
