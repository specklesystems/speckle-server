<template>
  <div>
    <div class="bg-foundation divide-y divide-outline-3 mb-8 empty:mb-0">
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
    <PromoBannersWrapper v-if="promoBanners.length" :banners="promoBanners" />
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql'
import type {
  ProjectsDashboardHeaderProjects_UserFragment,
  ProjectsDashboardHeaderWorkspaces_UserFragment
} from '~/lib/common/generated/gql/graphql'
import type { PromoBanner } from '~/lib/promo-banners/types'

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

defineProps<{
  projectsInvites?: ProjectsDashboardHeaderProjects_UserFragment
  workspacesInvites?: ProjectsDashboardHeaderWorkspaces_UserFragment
}>()

const promoBanners = ref<PromoBanner[]>([])
</script>
