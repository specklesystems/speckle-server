<template>
  <div v-if="treeItemCount" class="space-y-4 max-w-full">
    <div v-for="item in topLevelItems" :key="item.id">
      <ProjectPageModelsStructureItem
        :item="item"
        :project-id="projectId"
        :can-contribute="canContribute"
        :is-search-result="isUsingSearch"
        @model-updated="onModelUpdated"
      />
    </div>
    <ProjectPageModelsNewModelStructureItem
      v-if="canContribute && !isUsingSearch"
      :project-id="projectId"
    />
  </div>
  <CommonEmptySearchState
    v-else-if="
      search && (treeTopLevelResult?.project?.modelsTree.items || []).length === 0
    "
    @clear-search="$emit('clear-search')"
  />
  <div v-else>TODO: List empty state</div>
  <InfiniteLoading
    v-if="topLevelItems?.length && !disablePagination"
    :settings="{ identifier: infiniteLoadIdentifier }"
    @infinite="infiniteLoad"
  />
</template>
<script setup lang="ts">
import {
  PendingFileUploadFragment,
  ProjectPageLatestItemsModelsFragment,
  SingleLevelModelTreeItemFragment
} from '~~/lib/common/generated/gql/graphql'
import { useQuery, useQueryLoading } from '@vue/apollo-composable'
import { projectModelsTreeTopLevelQuery } from '~~/lib/projects/graphql/queries'
import { canModifyModels } from '~~/lib/projects/helpers/permissions'
import { ProjectModelsTreeTopLevelQueryVariables } from '~~/lib/common/generated/gql/graphql'
import { Nullable } from '@speckle/shared'
import { projectModelsTreeTopLevelPaginationQuery } from '~~/lib/projects/graphql/queries'
import { InfiniteLoaderState } from '~~/lib/global/helpers/components'

const emit = defineEmits<{
  (e: 'update:loading', v: boolean): void
  (e: 'clear-search'): void
}>()

const props = defineProps<{
  project: ProjectPageLatestItemsModelsFragment
  search?: string
  disablePagination?: boolean
}>()

const cursor = ref(null as Nullable<string>)

const areQueriesLoading = useQueryLoading()
const projectId = computed(() => props.project.id)

const baseQueryVariables = computed(
  (): ProjectModelsTreeTopLevelQueryVariables => ({
    projectId: projectId.value,
    filter: props.search ? { search: props.search } : undefined
  })
)

const infiniteLoadIdentifier = computed(() => {
  const vars = baseQueryVariables.value
  return JSON.stringify(vars.filter)
})

// Base query (all pending uploads + first page of models)
const {
  result: treeTopLevelResult,
  refetch: refetchTree,
  variables: resultVariables,
  onResult: onBaseQueryResult
} = useQuery(projectModelsTreeTopLevelQuery, () => baseQueryVariables.value)

onBaseQueryResult((res) => {
  if (props.disablePagination) return
  cursor.value = res.data?.project?.modelsTree.cursor || null
})

const isFiltering = computed(() => {
  const filter = resultVariables.value?.filter
  // if (filter?.contributors?.length) return true
  if (filter?.search?.length) return true
  // if (filter?.contributors?.length) return true
  return false
})

// Pagination query
const { onResult: onExtraPagesLoaded, fetchMore: fetchMorePages } = useQuery(
  projectModelsTreeTopLevelPaginationQuery,
  () => ({
    ...baseQueryVariables.value,
    cursor: cursor.value
  }),
  () => ({ enabled: !!(cursor.value && !props.disablePagination) })
)

onExtraPagesLoaded((res) => {
  if (props.disablePagination) return
  cursor.value = res.data?.project?.modelsTree.cursor || null
})

const pendingModels = computed(() =>
  isFiltering.value
    ? []
    : treeTopLevelResult.value?.project?.pendingImportedModels || []
)
const topLevelItems = computed(
  (): Array<SingleLevelModelTreeItemFragment | PendingFileUploadFragment> =>
    [
      ...pendingModels.value,
      ...(treeTopLevelResult.value?.project?.modelsTree.items || [])
    ].slice(0, props.disablePagination ? 8 : undefined)
)
const treeItemCount = computed(() => topLevelItems.value.length)
const canContribute = computed(() => canModifyModels(props.project))
const isUsingSearch = computed(() => !!resultVariables.value?.filter?.search)
const moreToLoad = computed(
  () =>
    (!treeTopLevelResult.value?.project ||
      treeTopLevelResult.value.project.modelsTree.items.length <
        treeTopLevelResult.value.project.modelsTree.totalCount) &&
    cursor.value
)

const onModelUpdated = () => refetchTree()

const infiniteLoad = async (state: InfiniteLoaderState) => {
  if (!moreToLoad.value) return state.complete()

  try {
    await fetchMorePages({
      variables: {
        cursor: cursor.value
      }
    })
  } catch (e) {
    console.error(e)
    state.error()
    return
  }

  state.loaded()
  if (!moreToLoad.value) {
    state.complete()
  }
}

watch(areQueriesLoading, (newVal) => {
  emit('update:loading', newVal)
})

watch(infiniteLoadIdentifier, (newId, oldId) => {
  // If filters changed, reset cursor
  if (newId !== oldId) {
    cursor.value = null
  }
})
</script>
