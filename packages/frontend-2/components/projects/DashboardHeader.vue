<template>
  <div>
    <div v-if="hasBanners" class="mb-8 empty:mb-0">
      <ProjectsInviteBanners
        v-if="projectsInvites?.projectInvites?.length"
        :invites="projectsInvites"
      />
      <WorkspaceInviteBanner
        v-for="invite in workspaceInvites"
        :key="invite.id"
        :invite="invite"
      />
      <WorkspaceInviteDiscoverableWorkspaceBanner
        v-for="workspace in discoverableWorkspaces"
        :key="workspace.id"
        :workspace="workspace"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useSynchronizedCookie } from '~/lib/common/composables/reactiveCookie'
import { graphql } from '~/lib/common/generated/gql'
import type {
  ProjectsDashboardHeaderProjects_UserFragment,
  ProjectsDashboardHeaderWorkspaces_UserFragment
} from '~/lib/common/generated/gql/graphql'
import { CookieKeys } from '~/lib/common/helpers/constants'

graphql(`
  fragment ProjectsDashboardHeaderProjects_User on User {
    ...ProjectsInviteBanners
  }
`)

graphql(`
  fragment ProjectsDashboardHeaderWorkspaces_User on User {
    discoverableWorkspaces {
      ...WorkspaceInviteDiscoverableWorkspaceBanner_DiscoverableWorkspace
    }
    workspaceInvites {
      ...WorkspaceInviteBanner_PendingWorkspaceCollaborator
    }
  }
`)

const props = defineProps<{
  projectsInvites?: ProjectsDashboardHeaderProjects_UserFragment
  workspacesInvites?: ProjectsDashboardHeaderWorkspaces_UserFragment
}>()

const dismissedDiscoverableWorkspaces = useSynchronizedCookie<string[]>(
  CookieKeys.DismissedDiscoverableWorkspaces,
  {
    default: () => []
  }
)

const workspaceInvites = computed(() => props.workspacesInvites?.workspaceInvites || [])
const discoverableWorkspaces = computed(
  () =>
    props.workspacesInvites?.discoverableWorkspaces?.filter(
      (workspace) => !dismissedDiscoverableWorkspaces.value.includes(workspace.id)
    ) || []
)

const hasBanners = computed(() => {
  return (
    props.projectsInvites?.projectInvites?.length ||
    workspaceInvites.value.length ||
    discoverableWorkspaces.value.length
  )
})
</script>
