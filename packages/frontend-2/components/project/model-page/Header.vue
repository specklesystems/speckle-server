<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink
        v-if="showWorkspaceLink"
        :to="workspaceRoute(project.workspace?.slug)"
        name="Projects"
        :separator="false"
      />
      <HeaderNavLink
        v-else-if="!isWorkspacesEnabled"
        :to="projectsRoute"
        name="Projects"
        :separator="false"
      />
      <HeaderNavLink
        :to="projectRoute(project.id)"
        :name="project.name"
        :separator="showWorkspaceLink || !isWorkspacesEnabled"
      />
      <HeaderNavLink
        v-if="props.project.model"
        :to="modelVersionsRoute(project.id, props.project.model.id)"
        :name="props.project.model.name"
      />
    </Portal>

    <CommonTitleDescription
      :title="project.model.name"
      :description="project.model.description"
    />
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectModelPageHeaderProjectFragment } from '~~/lib/common/generated/gql/graphql'
import {
  projectRoute,
  modelVersionsRoute,
  projectsRoute
} from '~~/lib/common/helpers/route'
import { workspaceRoute } from '~/lib/common/helpers/route'

graphql(`
  fragment ProjectModelPageHeaderProject on Project {
    id
    name
    model(id: $modelId) {
      id
      name
      description
    }
    workspace {
      id
      slug
      name
      role
    }
  }
`)

const props = defineProps<{
  project: ProjectModelPageHeaderProjectFragment
}>()

const isWorkspacesEnabled = useIsWorkspacesEnabled()
const showWorkspaceLink = computed(
  () => !!props.project.workspace?.role && isWorkspacesEnabled.value
)
</script>
