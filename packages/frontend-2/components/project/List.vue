<template>
  <section>
    <div class="flex items-center justify-between gap-4 my-8">
      <div class="flex items-center gap-4">
        <h1 class="h4 text-foreground font-bold flex items-center">
          Projects
          <span class="ml-2 caption text-foreground-2">{{ count }}</span>
        </h1>
        <FormButton class="mt-1">New +</FormButton>
      </div>
      <div v-if="enableSearch">
        <FormTextInput
          name="project search"
          label=""
          placeholder="search"
          class="bg-foundation shadow hover:shadow-lg"
        />
      </div>
    </div>
    <div v-if="count > 0">
      <ProjectListItem
        v-for="project in projects.slice(0, numProjects)"
        :key="project.id"
        :project="project"
      />
    </div>
    <div v-else>YO MAKE SOME PROJECTS</div>
  </section>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'

defineProps({
  /** Enable search or not */
  enableSearch: {
    type: Boolean,
    default: true
  },
  numProjects: {
    type: Number,
    default: 3
  }
})

const projectsQuery = graphql(`
  query ProjectsDashboardList {
    projects {
      ...ProjectListItemFragment
    }
  }
`)

const { result: projectResult } = useQuery(projectsQuery)

const count = computed(() => projectResult.value?.projects.length || 0)
const projects = computed(() => projectResult.value?.projects || [])
</script>
