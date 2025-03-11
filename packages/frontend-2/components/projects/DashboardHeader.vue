<template>
  <div>
    <div v-if="hasBanners" class="mb-8 empty:mb-0">
      <ProjectsInviteBanner
        v-for="item in projectsInvites?.projectInvites"
        :key="item?.id"
        :invite="item"
        :invites="projectsInvites"
      />
      <WorkspaceInviteBanner
        v-for="invite in workspaceInvites"
        :key="invite.id"
        :invite="invite"
      />
      <WorkspaceInviteDiscoverableWorkspaceBanner
        v-for="workspace in filteredDiscoverableWorkspaces"
        :key="workspace.id"
        :workspace="workspace"
        @dismiss="handleDismiss"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { useSynchronizedCookie } from '~/lib/common/composables/reactiveCookie'
import { graphql } from '~/lib/common/generated/gql'
import type {
  ProjectsDashboardHeaderProjects_UserFragment,
  ProjectsDashboardHeaderWorkspaces_UserFragment
} from '~/lib/common/generated/gql/graphql'
import { CookieKeys } from '~/lib/common/helpers/constants'
import { useDiscoverableWorkspaces } from '~/lib/workspaces/composables/discoverableWorkspaces'

graphql(`
  fragment ProjectsDashboardHeaderProjects_User on User {
    projectInvites {
      ...ProjectsInviteBanner
    }
  }
`)

graphql(`
  fragment ProjectsDashboardHeaderWorkspaces_User on User {
    workspaceInvites {
      ...WorkspaceInviteBanner_PendingWorkspaceCollaborator
    }
  }
`)

const props = defineProps<{
  projectsInvites: MaybeNullOrUndefined<ProjectsDashboardHeaderProjects_UserFragment>
  workspacesInvites: MaybeNullOrUndefined<ProjectsDashboardHeaderWorkspaces_UserFragment>
}>()

const dismissedDiscoverableWorkspaces = useSynchronizedCookie<string[]>(
  CookieKeys.DismissedDiscoverableWorkspaces,
  {
    default: () => []
  }
)

const { discoverableWorkspaces } = useDiscoverableWorkspaces()

const workspaceInvites = computed(() => props.workspacesInvites?.workspaceInvites || [])
const filteredDiscoverableWorkspaces = computed(
  () =>
    discoverableWorkspaces.value?.filter(
      (workspace) => !dismissedDiscoverableWorkspaces.value.includes(workspace.id)
    ) || []
)

const hasBanners = computed(() => {
  return (
    props.projectsInvites?.projectInvites?.length ||
    workspaceInvites.value.length ||
    filteredDiscoverableWorkspaces.value.length
  )
})

const handleDismiss = (workspaceId: string) => {
  dismissedDiscoverableWorkspaces.value = [
    ...dismissedDiscoverableWorkspaces.value,
    workspaceId
  ]
}
</script>
