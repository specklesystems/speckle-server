<template>
  <div>
    <h1 class="h2 mb-6">Projects</h1>
    <ProjectsDashboardFilled v-if="hasProjects" />
    <ProjectsDashboardEmptyState v-else />
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~~/lib/common/generated/gql'

const projectsPanelQuery = graphql(`
  query ProjectsPanelQuery {
    activeUser {
      projects {
        id
        name
      }
    }
  }
`)

const { result: projectsPanelResult } = useQuery(projectsPanelQuery)
const hasProjects = computed(
  () => (projectsPanelResult.value?.activeUser?.projects || []).length > 0
)
</script>
