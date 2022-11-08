<template>
  <section>
    <div class="flex items-center justify-between gap-4 my-8">
      <div class="flex items-center gap-4">
        <h1 class="h4 text-foreground font-bold flex items-center">
          Projects
          <span class="ml-2 caption text-foreground-dim">{{ count }}</span>
        </h1>
        <button
          class="rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-slate-800 hover:dark:bg-slate-900 text-blue-500 xxxdark:text-gray-500 text-sm shadow hover:shadow-md px-4 py-2 cursor-pointer transition"
        >
          New +
        </button>
      </div>
      <div v-if="enableSearch">
        <FormTextInput
          name=""
          label=""
          placeholder="search"
          class="bg-background shadow hover:shadow-lg"
        />
      </div>
    </div>
    <div v-if="count > 0">
      <ProjectListItem
        v-for="project in [...projects].splice(0, numProjects)"
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

const props = defineProps({
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
const loadedProjects = computed(() =>
  projects.value.length > 0 ? [...projects.value].splice(0, props.numProjects) : []
)
</script>
