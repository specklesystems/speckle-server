<template>
  <div>
    <Portal to="navigation">
      <template v-if="project.workspace && isWorkspacesEnabled">
        <HeaderNavLink
          :to="workspaceRoute(project.workspace.slug)"
          :name="isWorkspaceNewPlansEnabled ? 'Home' : project.workspace.name"
          :separator="false"
        />
      </template>
      <HeaderNavLink v-else :to="projectsRoute" name="Projects" :separator="false" />

      <HeaderNavLink :to="projectRoute(project.id)" :name="project.name" />
    </Portal>

    <div class="flex gap-x-3">
      <NuxtLink
        v-if="project.workspace && isWorkspacesEnabled"
        :to="workspaceRoute(project.workspace.slug)"
      >
        <WorkspaceAvatar
          :logo="project.workspace.logo"
          :name="project.workspace.name"
          size="sm"
          class="mt-0.5"
        />
      </NuxtLink>
      <CommonTitleDescription
        :title="project.name"
        :description="project.description"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectPageProjectHeaderFragment } from '~~/lib/common/generated/gql/graphql'
import { projectRoute, projectsRoute } from '~~/lib/common/helpers/route'
import { workspaceRoute } from '~/lib/common/helpers/route'

graphql(`
  fragment ProjectPageProjectHeader on Project {
    id
    name
    description
    workspace {
      id
      slug
      name
      logo
    }
  }
`)

defineProps<{
  project: ProjectPageProjectHeaderFragment
}>()

const isWorkspacesEnabled = useIsWorkspacesEnabled()
const isWorkspaceNewPlansEnabled = useWorkspaceNewPlansEnabled()
</script>
