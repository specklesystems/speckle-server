<template>
  <div>
    <Portal to="primary-actions">
      <FormButton :icon-left="PlusIcon">New Project</FormButton>
    </Portal>
    <div class="flex items-center mb-8 top-16">
      <h1 class="h4 font-bold flex-grow">Projects</h1>
      <div class="w-96">
        <FormTextInput
          v-model="search"
          name="modelsearch"
          :show-label="false"
          placeholder="Search"
          class="bg-foundation shadow"
          @change="debouncedSearch = search.trim()"
          @update:model-value="updateDebouncedSearch"
        ></FormTextInput>
      </div>
    </div>
    <ProjectsDashboardFilled
      v-if="projects?.items?.length && !forceEmptyState"
      :projects="projects"
    />
    <ProjectsDashboardEmptyState v-else-if="!search" />
    <div v-else>TODO: Project search empty state</div>
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { projectsDashboardQuery } from '~~/lib/projects/graphql/queries'
import { PlusIcon } from '@heroicons/vue/24/solid'
import { debounce } from 'lodash-es'

const search = ref('')
const debouncedSearch = ref('')

const route = useRoute()
const { result: projectsPanelResult } = useQuery(projectsDashboardQuery, () => {
  return {
    filter: {
      search: (debouncedSearch.value || '').trim() || null
    }
  }
})

const forceEmptyState = computed(() => !!route.query.forceEmpty)
const projects = computed(() => projectsPanelResult.value?.activeUser?.projects)

const updateDebouncedSearch = debounce(() => {
  debouncedSearch.value = search.value.trim()
}, 2000)
</script>
