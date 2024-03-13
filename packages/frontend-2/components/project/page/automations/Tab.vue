<template>
  <div>
    <ProjectPageAutomationsHeader
      v-model:search="search"
      :has-automations="hasAutomations"
      class="mb-8"
    />
    <ProjectPageAutomationsEmptyState v-if="!hasAutomations" :functions="result" />
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'

const automationsTabQuery = graphql(`
  query ProjectAutomationsTab($projectId: String!, $search: String, $cursor: String) {
    project(id: $projectId) {
      id
      automations(filter: $search, cursor: $cursor) {
        totalCount
      }
    }
    ...ProjectPageAutomationsEmptyState_Query
  }
`)

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const search = ref('')

const { result } = useQuery(automationsTabQuery, () => ({
  projectId: projectId.value,
  search: search.value,
  // TODO: Pagination
  cursor: null
}))

const hasAutomations = computed(
  () => (result.value?.project.automations.totalCount ?? 1) > 0
)
</script>
