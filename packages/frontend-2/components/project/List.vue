<template>
  <section class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
    <div class="flex items-center justify-between gap-4 my-8">
      <div class="flex items-center gap-4">
        <h1 class="h4 font-bold">Projects {{ count }}</h1>
        <button
          class="rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-slate-800 hover:dark:bg-slate-900 text-blue-500 xxxdark:text-gray-500 text-sm shadow hover:shadow-md px-4 py-2 cursor-pointer transition"
        >
          New +
        </button>
      </div>
      <div v-if="enableSearch">
        <FormTextInput name="search" label="" placeholder="search" />
      </div>
    </div>
    <div v-if="count > 0">
      <!-- TODO -->
      <ProjectListItem
        v-for="project in projects"
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
  }
})

const projectsQuery = graphql(`
  query ProjectsDashboardList {
    projects {
      ...ProjectListItemFragment
    }
  }
`)

const { result: projectResult, loading, error } = useQuery(projectsQuery)

const count = computed(() => projectResult.value?.projects.length)
const projects = computed(() => projectResult.value?.projects || [])
</script>
