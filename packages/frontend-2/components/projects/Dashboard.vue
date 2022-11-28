<template>
  <div>
    <h1 class="h2 font-bold leading-10 mb-6 mt-10">Projects</h1>
    <ProjectsDashboardFilled v-if="hasProjects" />
    <ProjectsDashboardEmptyState v-else />
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { projectsDashboardQuery } from '~~/lib/projects/graphql/queries'

const { result: projectsPanelResult } = useQuery(projectsDashboardQuery)
const hasProjects = computed(
  () => (projectsPanelResult.value?.activeUser?.projects || []).length > 0
)
</script>
