<template>
  <ProjectPageLatestItemsModelsList v-if="search" :models="searchResult" />
  <ProjectPageModelsStructuredView v-else :project="project" />
</template>
<script setup lang="ts">
import { ProjectPageModelsViewFragment } from '~~/lib/common/generated/gql/graphql'
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
