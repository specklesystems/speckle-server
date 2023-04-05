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
    v-else-if="isSearchResults && items.length === 0"
    @clear-search="() => $emit('clear-search')"
  />
  <div v-else>TODO: Grid empty state</div>
  <InfiniteLoading
    v-if="items?.length && !disablePagination"
    :settings="{ identifier: infiniteLoadIdentifier }"
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

// TODO: pendingImportedModels extract
// TODO: List view pagination, but thats gonna result in having to paginate pending uploads together w/
// actual branches.....so might as well do it for models query?
// - or maybe just always put pending uploads first? but what if theres more than 16?
// TODO: Fix models list/card, versions list/card to just preload pending first, and then load actual ones afterwards with pagination
// TODO: Fix cache updates to modelsTree cause of collection change
// TODO: ModelsTreeItem members/sources filter

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

const cursor = ref(null as Nullable<string>)
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

const infiniteLoadIdentifier = computed(() => {
  const vars = latestModelsQueryVariables.value
  return JSON.stringify(vars.filter)
})

// Base query (all pending uploads + first page of models)
const {
  result: latestModelsResult,
  variables: latestModelsVariables,
  onResult: onLatestModelsLoaded
} = useQuery(latestModelsQuery, () => latestModelsQueryVariables.value)

// Pagination query
const { onResult: onExtraPagesLoaded, fetchMore: fetchMorePages } = useQuery(
  latestModelsPaginationQuery,
  () => ({
    ...latestModelsQueryVariables.value,
    cursor: cursor.value
  }),
  () => ({ enabled: !!(cursor.value && !props.disablePagination) })
)

const isFiltering = computed(() => {
  const filter = latestModelsVariables.value?.filter
  if (filter?.contributors?.length) return true
  if (filter?.search?.length) return true
  if (filter?.sourceApps?.length) return true
  return false
})

onLatestModelsLoaded((res) => {
  if (props.disablePagination) return
  cursor.value = res.data?.project?.models?.cursor || null
})

onExtraPagesLoaded((res) => {
  if (props.disablePagination) return
  cursor.value = res.data?.project?.models?.cursor || null
})

const isSearchResults = computed(() => {
  const filter = latestModelsVariables.value?.filter || {}
  return Object.values(filter).some((v) => !!v)
})
const models = computed(() => latestModelsResult.value?.project?.models?.items || [])
const pendingModels = computed(() =>
  isFiltering.value
    ? []
    : latestModelsResult.value?.project?.pendingImportedModels || []
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
    (!latestModelsResult.value?.project ||
      latestModelsResult.value.project.models.items.length <
        latestModelsResult.value.project.models.totalCount) &&
    cursor.value
)

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
