<template>
  <div class="flex flex-col space-y-4">
    <div v-for="project in items" :key="project.id">
      <ProjectsProjectDashboardCard
        :key="project.id"
        :project="project"
        :show-workspace-link="showWorkspaceLink"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type {
  ProjectDashboardItemFragment,
  ProjectsDashboardFilledProjectFragment,
  ProjectsDashboardFilledUserFragment
} from '~~/lib/common/generated/gql/graphql'

const props = defineProps<{
  projects: ProjectsDashboardFilledProjectFragment | ProjectsDashboardFilledUserFragment
  showWorkspaceLink?: boolean
}>()

graphql(`
  fragment ProjectsDashboardFilledProject on ProjectCollection {
    items {
      ...ProjectDashboardItem
    }
  }
`)

graphql(`
  fragment ProjectsDashboardFilledUser on UserProjectCollection {
    items {
      ...ProjectDashboardItem
    }
  }
`)

const items = computed((): ProjectDashboardItemFragment[] => props.projects.items)
</script>
