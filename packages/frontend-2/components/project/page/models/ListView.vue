<template>
  <div v-if="topLevelItems.length" class="space-y-4 max-w-full">
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
      isFiltering && (treeTopLevelResult?.project?.modelsTree.items || []).length === 0
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
  SingleLevelModelTreeItemFragment,
  FormUsersSelectItemFragment
} from '~~/lib/common/generated/gql/graphql'
import { useQuery, useQueryLoading } from '@vue/apollo-composable'
import { projectModelsTreeTopLevelQuery } from '~~/lib/projects/graphql/queries'
import { canModifyModels } from '~~/lib/projects/helpers/permissions'
import { ProjectModelsTreeTopLevelQueryVariables } from '~~/lib/common/generated/gql/graphql'
import { Nullable, SourceAppDefinition } from '@speckle/shared'
import { projectModelsTreeTopLevelPaginationQuery } from '~~/lib/projects/graphql/queries'
import { InfiniteLoaderState } from '~~/lib/global/helpers/components'
import { useEvictProjectModelFields } from '~~/lib/projects/composables/modelManagement'

const emit = defineEmits<{
  (e: 'update:loading', v: boolean): void
  (e: 'clear-search'): void
}>()

const props = defineProps<{
  project: ProjectPageLatestItemsModelsFragment
  search?: string
  disablePagination?: boolean
  sourceApps?: SourceAppDefinition[]
  contributors?: FormUsersSelectItemFragment[]
}>()

const infiniteLoadCacheBuster = ref(0)

const evictModelFields = useEvictProjectModelFields()
const areQueriesLoading = useQueryLoading()
const projectId = computed(() => props.project.id)

const baseQueryVariables = computed(
  (): ProjectModelsTreeTopLevelQueryVariables => ({
    projectId: projectId.value,
    filter: {
      search: props.search || null,
      sourceApps: props.sourceApps?.length
        ? props.sourceApps.map((a) => a.searchKey)
        : null,
      contributors: props.contributors?.length
        ? props.contributors.map((c) => c.id)
        : null
    }
  })
)

const infiniteLoadIdentifier = computed(() => {
  const vars = baseQueryVariables.value
  return JSON.stringify(vars.filter) + `${infiniteLoadCacheBuster.value}`
})

// Base query (all pending uploads + first page of models)
const { result: treeTopLevelResult, variables: resultVariables } = useQuery(
  projectModelsTreeTopLevelQuery,
  () => baseQueryVariables.value
)

const isFiltering = computed(() => {
  const filter = resultVariables.value?.filter
  if (filter?.contributors?.length) return true
  if (filter?.search?.length) return true
  if (filter?.sourceApps?.length) return true
  return false
})

// Pagination query
const { result: extraPagesResult, fetchMore: fetchMorePages } = useQuery(
  projectModelsTreeTopLevelPaginationQuery,
  () => ({
    ...baseQueryVariables.value,
    cursor: null as Nullable<string>
  }),
  () => ({ enabled: !props.disablePagination })
)

const pendingModels = computed(() =>
  isFiltering.value
    ? []
    : treeTopLevelResult.value?.project?.pendingImportedModels || []
)
const modelTreeItems = computed(
  () => extraPagesResult.value?.project?.modelsTree.items || []
)

const topLevelItems = computed(
  (): Array<SingleLevelModelTreeItemFragment | PendingFileUploadFragment> =>
    [...pendingModels.value, ...modelTreeItems.value].slice(
      0,
      props.disablePagination ? 8 : undefined
    )
)
const canContribute = computed(() => canModifyModels(props.project))
const isUsingSearch = computed(() => !!resultVariables.value?.filter?.search)
const moreToLoad = computed(
  () =>
    !extraPagesResult.value?.project ||
    extraPagesResult.value.project.modelsTree.items.length <
      extraPagesResult.value.project.modelsTree.totalCount
)

const onModelUpdated = () => {
  // Evict model data
  evictModelFields(props.project.id)

  // Reset pagination
  infiniteLoadCacheBuster.value++
}

const infiniteLoad = async (state: InfiniteLoaderState) => {
  const cursor =
    extraPagesResult.value?.project?.modelsTree.cursor ||
    treeTopLevelResult.value?.project?.modelsTree.cursor ||
    null
  if (!moreToLoad.value || !cursor) return state.complete()

  try {
    await fetchMorePages({
      variables: {
        cursor
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
</script>
