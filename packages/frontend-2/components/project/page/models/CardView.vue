<template>
  <div v-if="itemsCount" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
    <!-- Decrementing z-index necessary for the actions menu to render correctly. Each card has its own stacking context because of the scale property -->
    <ProjectPageModelsCard
      v-for="(item, i) in items"
      :key="item.id"
      :model="item"
      :project="project"
      :show-actions="showActions"
      :show-versions="showVersions"
      :disable-default-link="disableDefaultLinks"
      :style="`z-index: ${items.length - i};`"
      @click="($event) => $emit('model-clicked', { id: item.id, e: $event })"
    />
  </div>
  <CommonEmptySearchState
    v-else-if="isFiltering && items.length === 0"
    @clear-search="() => $emit('clear-search')"
  />
  <div v-else>
    <ProjectCardImportFileArea :project-id="project.id" class="h-36 col-span-4" />
  </div>
  <InfiniteLoading
    v-if="items?.length && !disablePagination"
    :settings="{ identifier: infiniteLoaderId }"
    @infinite="infiniteLoad"
  />
</template>
<script setup lang="ts">
import {
  FormUsersSelectItemFragment,
  ProjectLatestModelsPaginationQueryVariables,
  ProjectPageLatestItemsModelsFragment
} from '~~/lib/common/generated/gql/graphql'
import { useQuery, useQueryLoading } from '@vue/apollo-composable'
import {
  latestModelsPaginationQuery,
  latestModelsQuery
} from '~~/lib/projects/graphql/queries'
import { Nullable, SourceAppDefinition } from '@speckle/shared'
import { InfiniteLoaderState } from '~~/lib/global/helpers/components'

const emit = defineEmits<{
  (e: 'update:loading', v: boolean): void
  (e: 'model-clicked', v: { id: string; e: MouseEvent }): void
  (e: 'clear-search'): void
}>()

const props = withDefaults(
  defineProps<{
    project: ProjectPageLatestItemsModelsFragment
    search?: string
    showActions?: boolean
    showVersions?: boolean
    disableDefaultLinks?: boolean
    excludedIds?: string[]
    excludeEmptyModels?: boolean
    disablePagination?: boolean
    sourceApps?: SourceAppDefinition[]
    contributors?: FormUsersSelectItemFragment[]
  }>(),
  {
    showActions: true,
    showVersions: true
  }
)

const logger = useLogger()
const areQueriesLoading = useQueryLoading()

const latestModelsQueryVariables = computed(
  (): ProjectLatestModelsPaginationQueryVariables => ({
    projectId: props.project.id,
    filter: {
      search: props.search || null,
      excludeIds: props.excludedIds || null,
      onlyWithVersions: !!props.excludeEmptyModels,
      sourceApps: props.sourceApps?.length
        ? props.sourceApps.map((a) => a.searchKey)
        : null,
      contributors: props.contributors?.length
        ? props.contributors.map((c) => c.id)
        : null
    }
  })
)

const infiniteLoaderId = ref('')

// Base query (all pending uploads + first page of models)
const {
  result: baseResult,
  variables: latestModelsVariables,
  onResult: onBaseResult
} = useQuery(latestModelsQuery, () => latestModelsQueryVariables.value)

// Pagination query
const {
  result: extraPagesResult,
  fetchMore: fetchMorePages,
  onResult: onExtraPagesResult
} = useQuery(
  latestModelsPaginationQuery,
  () => ({
    ...latestModelsQueryVariables.value,
    cursor: null as Nullable<string>
  }),
  () => ({ enabled: !props.disablePagination })
)

const isFiltering = computed(() => {
  const filter = latestModelsVariables.value?.filter
  if (filter?.contributors?.length) return true
  if (filter?.search?.length) return true
  if (filter?.sourceApps?.length) return true
  return false
})

const models = computed(() =>
  extraPagesResult.value
    ? extraPagesResult.value?.project?.models?.items || []
    : baseResult.value?.project?.models?.items || []
)
const pendingModels = computed(() =>
  isFiltering.value ? [] : baseResult.value?.project?.pendingImportedModels || []
)

const items = computed(() =>
  [...pendingModels.value, ...models.value].slice(
    0,
    props.disablePagination ? 16 : undefined
  )
)
const itemsCount = computed(() => items.value.length)
const moreToLoad = computed(
  () =>
    !baseResult.value?.project ||
    baseResult.value.project.models.items.length <
      baseResult.value.project.models.totalCount
)

const infiniteLoad = async (state: InfiniteLoaderState) => {
  const cursor =
    extraPagesResult.value?.project?.models.cursor ||
    baseResult.value?.project?.models.cursor ||
    null
  if (!moreToLoad.value || !cursor) return state.complete()

  try {
    await fetchMorePages({
      variables: {
        cursor
      }
    })
  } catch (e) {
    logger.error(e)
    state.error()
    return
  }

  state.loaded()
  if (!moreToLoad.value) {
    state.complete()
  }
}

const calculateLoaderId = () => {
  const vars = latestModelsQueryVariables.value
  const id = JSON.stringify(vars.filter)
  infiniteLoaderId.value = id
}

watch(areQueriesLoading, (newVal) => {
  emit('update:loading', newVal)
})

onBaseResult(calculateLoaderId)
onExtraPagesResult(calculateLoaderId)
</script>
