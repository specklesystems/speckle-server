<template>
  <div>
    <div v-if="project">
      <!-- Heading text w/ actions -->
      <ProjectPageHeader :project="project" class="mb-8" />
      <!-- Stats blocks -->
      <div class="flex flex-col md:flex-row space-y-2 md:space-x-4 mb-14">
        <ProjectPageStatsBlockTeam
          :project="project"
          class="shadow hover:shadow-xl w-full md:w-72 transition"
        />
        <div class="grow hidden md:flex"></div>
        <ProjectPageStatsBlockVersions :project="project" />
        <ProjectPageStatsBlockModels :project="project" />
        <ProjectPageStatsBlockComments :project="project" />
      </div>
      <div class="flex flex-col space-y-14">
        <!-- Latest models -->
        <ProjectPageModelsView :project="project" />
        <!-- Latest comments -->
        <ProjectPageLatestItemsComments :project="project" />
        <!-- More actions -->
        <ProjectPageMoreActions />
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
    ...ProjectPageStatsBlockTeam
    ...ProjectPageStatsBlockVersions
    ...ProjectPageStatsBlockModels
    ...ProjectPageStatsBlockComments
    ...ProjectPageLatestItemsModels
    ...ProjectPageLatestItemsComments
    ...ProjectPageModelsView
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
