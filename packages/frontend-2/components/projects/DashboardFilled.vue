<template>
  <div class="flex flex-col space-y-4 relative">
    <!-- Decrementing z-index to ensure later cards don't overflow over earlier card action menus -->
    <div
      v-for="(project, i) in items"
      :key="project.id"
      :style="{ 'z-index': items.length - i }"
      class="relative"
    >
      <ProjectsProjectDashboardCard
        :key="project.id"
        :project="project"
        :show-workspace-link="showWorkspaceLink"
        :workspace-page="workspacePage"
        @move-project="$emit('moveProject', project.id)"
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

defineEmits<{
  (e: 'moveProject', projectId: string): void
}>()

const props = defineProps<{
  projects: ProjectsDashboardFilledProjectFragment | ProjectsDashboardFilledUserFragment
  showWorkspaceLink?: boolean
  workspacePage?: boolean
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
