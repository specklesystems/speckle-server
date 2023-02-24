<template>
  <div
    v-if="search && searchResult?.project?.models.items.length !== 0"
    class="space-y-4"
  >
    <ProjectPageModelsStructureItem
      v-for="item in searchResultItems"
      :key="item.model?.id"
      :item="item"
      :project-id="project.id"
    />
  </div>

  <CommonEmptySearchState
    v-else-if="search && searchResult?.project?.models.items.length === 0"
    @clear-search="$emit('clear-search')"
  />

  <ProjectPageModelsStructuredView v-else :project="project" />
</template>
<script setup lang="ts">
import {
  ProjectPageModelsViewFragment,
  SingleLevelModelTreeItemFragment
} from '~~/lib/common/generated/gql/graphql'
import { useQuery, useQueryLoading } from '@vue/apollo-composable'
import { latestModelsQuery } from '~~/lib/projects/graphql/queries'

const emit = defineEmits<{
  (e: 'update:loading', v: boolean): void
  (e: 'clear-search'): void
}>()

const props = defineProps<{
  project: ProjectPageModelsViewFragment
  search?: string
}>()

const areQueriesLoading = useQueryLoading()
const { result: searchResult } = useQuery(
  latestModelsQuery,
  () => ({
    projectId: props.project.id,
    filter: {
      search: props.search || null
    }
  }),
  () => ({ enabled: !!props.search })
)

watch(areQueriesLoading, (newVal) => {
  emit('update:loading', newVal)
})

const searchResultItems = computed(() => {
  return searchResult.value?.project?.models.items.map((item) => {
    return {
      name: item.name,
      model: item
    } as unknown as SingleLevelModelTreeItemFragment
  })
})
</script>
