<template>
  <div class="flex flex-col space-y-4">
    <div v-for="project in items" :key="project.id">
      <ProjectsProjectDashboardCard :key="project.id" :project="project" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { ProjectsDashboardFilledFragment } from '~~/lib/common/generated/gql/graphql'

const props = defineProps<{
  projects: ProjectsDashboardFilledFragment
}>()

graphql(`
  fragment ProjectsDashboardFilled on ProjectCollection {
    items {
      ...ProjectDashboardItem
    }
  }
`)

const items = computed(() => props.projects.items)
</script>
