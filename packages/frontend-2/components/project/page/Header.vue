<template>
  <div>
    <Portal to="navigation">
      <template v-if="project.workspace && isWorkspacesEnabled">
        <HeaderNavLink
          :to="workspacesRoute"
          name="Workspaces"
          :separator="false"
        ></HeaderNavLink>
        <HeaderNavLink
          :to="workspaceRoute(project.workspace.id)"
          :name="project.workspace.name"
        ></HeaderNavLink>
      </template>
      <HeaderNavLink
        v-else
        :to="projectsRoute"
        name="Projects"
        :separator="false"
      ></HeaderNavLink>

      <HeaderNavLink
        :to="projectRoute(project.id)"
        :name="project.name"
      ></HeaderNavLink>
    </Portal>

    <CommonTitleDescription :title="project.name" :description="project.description" />
    <NuxtLink
      v-if="project.workspace && isWorkspacesEnabled"
      :to="workspaceRoute(project.workspace.id)"
      class="pt-4 flex-1 flex items-center"
    >
      <WorkspaceAvatar
        :logo="project.workspace.logo"
        :default-logo-index="project.workspace.defaultLogoIndex"
        size="sm"
      />
      <p class="text-body-2xs text-foreground ml-2">
        {{ project.workspace.name }}
      </p>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectPageProjectHeaderFragment } from '~~/lib/common/generated/gql/graphql'
import { projectRoute, projectsRoute } from '~~/lib/common/helpers/route'
import { workspaceRoute, workspacesRoute } from '~/lib/common/helpers/route'

graphql(`
  fragment ProjectPageProjectHeader on Project {
    id
    role
    name
    description
    visibility
    allowPublicComments
    workspace {
      id
      name
      ...WorkspaceAvatar_Workspace
    }
  }
`)

const isWorkspacesEnabled = useIsWorkspacesEnabled()

defineProps<{
  project: ProjectPageProjectHeaderFragment
}>()
</script>
