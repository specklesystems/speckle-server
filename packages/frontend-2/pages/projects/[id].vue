<template>
  <div>
    <div v-if="project">
      <!-- Heading text w/ actions -->
      <ProjectPageHeader :project="project" class="mb-8" />
      <!-- Stats blocks -->
      <div class="grid grid-cols-12 gap-8">
        <ProjectPageStatsBlock>Hello world</ProjectPageStatsBlock>
        <ProjectPageStatsBlock>Hello world</ProjectPageStatsBlock>
        <ProjectPageStatsBlock>Hello world</ProjectPageStatsBlock>
        <ProjectPageStatsBlock>Hello world</ProjectPageStatsBlock>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { projectPageQuery } from '~~/lib/projects/graphql/queries'

definePageMeta({
  middleware: ['require-valid-project']
})

const route = useRoute()
const { result: projectPageResult } = useQuery(projectPageQuery, () => ({
  id: route.params.id as string
}))

const project = computed(() => projectPageResult.value?.project)
</script>
