<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink
        :to="projectRoute(project.id)"
        :name="project.name"
      ></HeaderNavLink>
      <HeaderNavLink
        v-if="model"
        :to="modelVersionsRoute(project.id, model.id)"
        :name="model.name"
      ></HeaderNavLink>
    </Portal>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { ProjectModelPageHeaderProjectFragment } from '~~/lib/common/generated/gql/graphql'
import { projectRoute, modelVersionsRoute } from '~~/lib/common/helpers/route'

graphql(`
  fragment ProjectModelPageHeaderProject on Project {
    id
    name
    model(id: $modelId) {
      id
      name
    }
  }
`)

const props = defineProps<{
  project: ProjectModelPageHeaderProjectFragment
}>()

const model = computed(() => props.project.model)
</script>
