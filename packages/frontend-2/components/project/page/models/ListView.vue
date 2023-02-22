<template>
  <div
    v-if="search && searchResult?.project?.models.items.length !== 0"
    class="space-y-4"
  >
    <ProjectPageModelsStructureItem
      v-for="item in searchResult?.project?.models.items"
      :key="item.id"
      :item="{ name: item.name, model: item } as unknown as SingleLevelModelTreeItemFragment"
      :project-id="project.id"
    />
  </div>
  <div v-else-if="search && searchResult?.project?.models.items.length === 0">
    TODO: Empty search result state
  </div>
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
</script>
