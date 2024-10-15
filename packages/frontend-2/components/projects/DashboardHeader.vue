<template>
  <div>
    <div v-if="hasBanners" class="space-y-3 mb-8 empty:mb-0">
      <ProjectsInviteBanners
        v-if="projectsInvites?.projectInvites?.length"
        :invites="projectsInvites"
      />
      <WorkspaceInviteBanners
        v-if="
          workspacesInvites?.workspaceInvites?.length ||
          workspacesInvites?.discoverableWorkspaces?.length
        "
        :invites="workspacesInvites"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql'
import type {
  ProjectsDashboardHeaderProjects_UserFragment,
  ProjectsDashboardHeaderWorkspaces_UserFragment
} from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment ProjectsDashboardHeaderProjects_User on User {
    ...ProjectsInviteBanners
  }
`)

graphql(`
  fragment ProjectsDashboardHeaderWorkspaces_User on User {
    ...WorkspaceInviteBanners_User
  }
`)

const props = defineProps<{
  projectsInvites?: ProjectsDashboardHeaderProjects_UserFragment
  workspacesInvites?: ProjectsDashboardHeaderWorkspaces_UserFragment
}>()

const hasBanners = computed(() => {
  return (
    props.projectsInvites?.projectInvites?.length ||
    props.workspacesInvites?.workspaceInvites?.length ||
    props.workspacesInvites?.discoverableWorkspaces?.length
  )
})
</script>
