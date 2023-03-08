<template>
  <div>
    <h1 class="block h4 font-bold mb-8">Versions</h1>
    <div
      v-if="items?.length && project.model"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3"
    >
      <ProjectModelPageVersionsCard
        v-for="item in items"
        :key="item.id"
        :version="item"
        :model-id="project.model.id"
        :project-id="project.id"
      />
    </div>
    <div v-else>TODO: Versions Empty state</div>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { ProjectModelPageVersionsProjectFragment } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment ProjectModelPageVersionsProject on Project {
    id
    model(id: $modelId) {
      id
      versions(limit: 16) {
        totalCount
        items {
          ...ProjectModelPageVersionsCardVersion
        }
      }
    }
  }
`)

const props = defineProps<{
  project: ProjectModelPageVersionsProjectFragment
}>()

const items = computed(() => props.project.model?.versions.items)
</script>
