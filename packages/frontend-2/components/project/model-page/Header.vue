<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink
        :to="projectRoute(project.id)"
        :name="project.name"
      ></HeaderNavLink>
      <HeaderNavLink
        v-if="props.project.model"
        :to="modelVersionsRoute(project.id, props.project.model.id)"
        :name="props.project.model.name"
      ></HeaderNavLink>
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
import { projectRoute, modelVersionsRoute } from '~~/lib/common/helpers/route'

graphql(`
  fragment ProjectModelPageHeaderProject on Project {
    id
    name
    model(id: $modelId) {
      id
      name
      description
    }
  }
`)

const props = defineProps<{
  project: ProjectModelPageHeaderProjectFragment
}>()
</script>
