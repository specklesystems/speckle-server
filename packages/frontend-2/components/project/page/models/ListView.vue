<template>
  <div>
    <div v-if="topLevelItems.length && project" class="space-y-2 max-w-full">
      <div v-for="item in topLevelItems" :key="item.id">
        <ProjectPageModelsStructureItem
          :item="item"
          :project="project"
          :can-contribute="canContribute"
          :is-search-result="isUsingSearch"
          @model-updated="onModelUpdated"
          @create-submodel="onCreateSubmodel"
        />
      </div>
      <FormButtonSecondaryViewAll
        v-if="showViewAll"
        :to="allProjectModelsRoute(projectId)"
      />
    </div>
    <template v-else-if="!areQueriesLoading">
      <CommonEmptySearchState
        v-if="
          !topLevelItems.length &&
          isFiltering &&
          (baseResult?.project?.modelsTree.items || []).length === 0
        "
        @clear-search="$emit('clear-search')"
      />
      <div v-else>
        <ProjectCardImportFileArea :project-id="projectId" class="h-36 col-span-4" />
      </div>
    </template>
    <InfiniteLoading
      v-if="topLevelItems?.length && !disablePagination"
      :settings="{ identifier: infiniteLoaderId }"
      @infinite="infiniteLoad"
    />
    <ProjectPageModelsNewDialog
      v-model:open="showNewDialog"
      :project-id="projectId"
      :parent-model-name="newSubmodelParent || undefined"
    />
  </div>
</template>
<script setup lang="ts">
import type {
  PendingFileUploadFragment,
  ProjectPageLatestItemsModelsFragment,
  SingleLevelModelTreeItemFragment,
  FormUsersSelectItemFragment,
  ProjectModelsTreeTopLevelQueryVariables
} from '~~/lib/common/generated/gql/graphql'
import { useQuery, useQueryLoading } from '@vue/apollo-composable'
import {
  projectModelsTreeTopLevelQuery,
  projectModelsTreeTopLevelPaginationQuery
} from '~~/lib/projects/graphql/queries'
import { canModifyModels } from '~~/lib/projects/helpers/permissions'
import type { Nullable, SourceAppDefinition } from '@speckle/shared'
import type { InfiniteLoaderState } from '~~/lib/global/helpers/components'
import { useEvictProjectModelFields } from '~~/lib/projects/composables/modelManagement'
import { allProjectModelsRoute } from '~~/lib/common/helpers/route'

const emit = defineEmits<{
  (e: 'update:loading', v: boolean): void
  (e: 'clear-search'): void
}>()

const props = defineProps<{
  projectId: string
  project?: ProjectPageLatestItemsModelsFragment
  search?: string
  disablePagination?: boolean
  sourceApps?: SourceAppDefinition[]
  contributors?: FormUsersSelectItemFragment[]
}>()

const logger = useLogger()

const infiniteLoadCacheBuster = ref(0)
const newSubmodelParent = ref('')
const showNewDialog = computed({
  get: () => !!newSubmodelParent.value,
  set: (newVal) => {
    if (!newVal) {
      newSubmodelParent.value = ''
    }
  }
})

const evictModelFields = useEvictProjectModelFields()
const areQueriesLoading = useQueryLoading()

const baseQueryVariables = computed(
  (): ProjectModelsTreeTopLevelQueryVariables => ({
    projectId: props.projectId,
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

const infiniteLoaderId = ref('')

// Base query (all pending uploads + first page of models)
const {
  result: baseResult,
  variables: resultVariables,
  onResult: onBaseResult
} = useQuery(projectModelsTreeTopLevelQuery, () => baseQueryVariables.value)

const isFiltering = computed(() => {
  const filter = resultVariables.value?.filter
  if (filter?.contributors?.length) return true
  if (filter?.search?.length) return true
  if (filter?.sourceApps?.length) return true
  return false
})

// Pagination query
const {
  result: extraPagesResult,
  fetchMore: fetchMorePages,
  onResult: onExtraPagesResult
} = useQuery(
  projectModelsTreeTopLevelPaginationQuery,
  () => ({
    ...baseQueryVariables.value,
    cursor: null as Nullable<string>
  }),
  () => ({ enabled: !props.disablePagination })
)

const pendingModels = computed(() =>
  isFiltering.value ? [] : baseResult.value?.project?.pendingImportedModels || []
)
const modelTreeItems = computed(() =>
  extraPagesResult.value
    ? extraPagesResult.value?.project?.modelsTree.items || []
    : baseResult.value?.project?.modelsTree.items || []
)

const topLevelItems = computed(
  (): Array<SingleLevelModelTreeItemFragment | PendingFileUploadFragment> =>
    [...pendingModels.value, ...modelTreeItems.value].slice(
      0,
      props.disablePagination ? 8 : undefined
    )
)
const canContribute = computed(() =>
  props.project ? canModifyModels(props.project) : false
)
const isUsingSearch = computed(() => !!resultVariables.value?.filter?.search)
const moreToLoad = computed(
  () =>
    !extraPagesResult.value?.project ||
    extraPagesResult.value.project.modelsTree.items.length <
      extraPagesResult.value.project.modelsTree.totalCount
)
const showViewAll = computed(() => moreToLoad.value && props.disablePagination)

const onModelUpdated = () => {
  // Evict model data
  evictModelFields(props.projectId)

  // Reset pagination
  infiniteLoadCacheBuster.value++
  calculateLoaderId()
}

const onCreateSubmodel = (parentModelName: string) => {
  newSubmodelParent.value = parentModelName
}

const infiniteLoad = async (state: InfiniteLoaderState) => {
  const cursor =
    extraPagesResult.value?.project?.modelsTree.cursor ||
    baseResult.value?.project?.modelsTree.cursor ||
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
  const vars = baseQueryVariables.value
  const id = JSON.stringify(vars.filter) + `${infiniteLoadCacheBuster.value}`
  infiniteLoaderId.value = id
}

watch(areQueriesLoading, (newVal) => {
  emit('update:loading', newVal)
})

onBaseResult(calculateLoaderId)
onExtraPagesResult(calculateLoaderId)
</script>
