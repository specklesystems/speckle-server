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
    <div class="flex lg:flex-col items-center lg:items-start gap-4 pb-0 lg:pb-4 mt-1">
      <div class="flex items-center gap-1">
        <UserAvatarGroup
          :overlap="false"
          :users="team.map((teamMember) => teamMember.user)"
          :max-avatars="3"
          class="shrink-0"
        />
        <button
          v-if="invitedTeamCount && isWorkspaceAdmin"
          class="hidden md:flex items-center shrink-0 justify-center text-body-3xs px-2 h-8 rounded-full border border-dashed border-outline-2 hover:bg-foundation select-none"
          @click="
            navigateTo(settingsRoutes.workspace.members.route(workspaceInfo.slug))
          "
        >
          + {{ invitedTeamCount }} pending
        </button>
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
import { graphql } from '~~/lib/common/generated/gql'
import type { WorkspaceSidebarMembers_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import { settingsRoutes } from '~/lib/common/helpers/route'

graphql(`
  fragment WorkspaceSidebarMembers_Workspace on Workspace {
    ...WorkspaceTeam_Workspace
  }
`)

defineEmits<{
  (e: 'show-invite-dialog'): void
}>()

const props = defineProps<{
  workspaceInfo: WorkspaceSidebarMembers_WorkspaceFragment
  collapsible?: boolean
  isWorkspaceAdmin?: boolean
}>()

const team = computed(() => props.workspaceInfo.team.items || [])

const iconName = computed(() => {
  if (!props.isWorkspaceAdmin) return undefined
  return 'edit'
})

const iconClick = computed(() => {
  if (!props.isWorkspaceAdmin) return undefined
  return () =>
    navigateTo(settingsRoutes.workspace.members.route(props.workspaceInfo.slug))
})

const iconText = computed(() => {
  if (!props.isWorkspaceAdmin) return undefined
  return 'Manage members'
})

const invitedTeamCount = computed(() => props.workspaceInfo?.invitedTeam?.length ?? 0)
</script>
