<template>
  <div>
    <div v-if="project">
      <!-- Heading text w/ actions -->
      <ProjectPageHeader :project="project" class="mb-8" />
      <!-- Stats blocks -->
      <div class="grid grid-cols-12 gap-8 mb-14">
        <ProjectPageStatsBlockTeam />
        <ProjectPageStatsBlockVersions />
        <ProjectPageStatsBlockModels />
        <ProjectPageStatsBlockComments />
      </div>
      <div class="flex flex-col space-y-14">
        <!-- Latest models -->
        <ProjectPageLatestItemsModels />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~~/lib/common/generated/gql'
import { projectPageQuery } from '~~/lib/projects/graphql/queries'

graphql(`
  fragment ProjectPageProject on Project {
    id
    createdAt
    ...ProjectPageProjectHeader
  }
`)

definePageMeta({
  middleware: ['require-valid-project']
})

const route = useRoute()
const { result: projectPageResult } = useQuery(projectPageQuery, () => ({
  id: route.params.id as string
}))

const project = computed(() => projectPageResult.value?.project)
</script>
