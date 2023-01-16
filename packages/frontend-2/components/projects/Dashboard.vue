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
          show-clear
          @change="updateSearchImmediately"
          @update:model-value="updateDebouncedSearch"
        ></FormTextInput>
      </div>
    </div>
    <template v-if="areQueriesLoading">TODO: Stuff is loading, please wait</template>
    <template v-else>
      <ProjectsDashboardEmptyState
        v-if="!searchKey && (forceEmptyState || (projects && !projects.totalCount))"
      />
      <ProjectsDashboardFilled
        v-else-if="projects?.items?.length"
        :projects="projects"
      />
      <div v-else>TODO: Project search empty state</div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { useQuery, useQueryLoading } from '@vue/apollo-composable'
import { projectsDashboardQuery } from '~~/lib/projects/graphql/queries'
import { PlusIcon } from '@heroicons/vue/24/solid'
import { debounce } from 'lodash-es'

const search = ref('')
const debouncedSearch = ref('')

const route = useRoute()
const areQueriesLoading = useQueryLoading()
const { result: projectsPanelResult, variables: searchVariables } = useQuery(
  projectsDashboardQuery,
  () => {
    return {
      filter: {
        search: (debouncedSearch.value || '').trim() || null
      }
    }
  }
)

const searchKey = computed(() => searchVariables.value?.filter?.search)
const forceEmptyState = computed(() => !!route.query.forceEmpty)
const projects = computed(() => projectsPanelResult.value?.activeUser?.projects)

const updateDebouncedSearch = debounce(() => {
  debouncedSearch.value = search.value.trim()
}, 2000)

const updateSearchImmediately = () => {
  updateDebouncedSearch.cancel()
  debouncedSearch.value = search.value.trim()
}
</script>
