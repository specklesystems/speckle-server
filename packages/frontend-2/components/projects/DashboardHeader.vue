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
        v-for="workspace in discoverableWorkspaces"
        :key="workspace.id"
        :workspace="workspace"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { graphql } from '~/lib/common/generated/gql'
import type {
  ProjectsDashboardHeaderProjects_UserFragment,
  ProjectsDashboardHeaderWorkspaces_UserFragment
} from '~/lib/common/generated/gql/graphql'
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

const { discoverableWorkspaces } = useDiscoverableWorkspaces()

const workspaceInvites = computed(() => props.workspacesInvites?.workspaceInvites || [])

const hasBanners = computed(() => {
  return (
    props.projectsInvites?.projectInvites?.length ||
    workspaceInvites.value.length ||
    discoverableWorkspaces.value?.length
  )
})
</script>
