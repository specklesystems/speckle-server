<template>
  <div>
    <Portal to="primary-actions">
      <FormButton :icon-left="PlusIcon">New Project</FormButton>
    </Portal>
    <div class="flex items-center mb-8 top-16">
      <h1 class="h4 font-bold flex-grow">Projects</h1>
      <div class="w-96">
        <FormTextInput
          name="modelsearch"
          :show-label="false"
          placeholder="Search"
          class="bg-foundation shadow"
        ></FormTextInput>
      </div>
    </div>
    <ProjectsDashboardFilled
      v-if="projects?.items?.length && !forceEmptyState"
      :projects="projects"
    />
    <ProjectsDashboardEmptyState v-else />
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { projectsDashboardQuery } from '~~/lib/projects/graphql/queries'
import { PlusIcon } from '@heroicons/vue/24/solid'
const route = useRoute()

const forceEmptyState = computed(() => !!route.query.forceEmpty)
const { result: projectsPanelResult } = useQuery(projectsDashboardQuery)
const projects = computed(() => projectsPanelResult.value?.activeUser?.projects)
</script>
