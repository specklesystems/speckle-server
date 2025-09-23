<template>
  <div class="relative grid grid-cols-1 gap-2">
    <FormTextInput
      v-model="searchText"
      :placeholder="totalCount === 0 ? 'New model name' : 'Search models'"
      name="search"
      autocomplete="off"
      :show-clear="!!searchText"
      full-width
      color="foundation"
    />

    <CommonLoadingBar v-if="loading" loading />
    <IntegrationsAccModelItem
      v-for="model in models"
      :key="model.id"
      :model="model"
      :selected="model.id === selectedModel?.id"
      :disabled="!!props.accSyncItems?.find((i) => i.modelId === model.id)"
      @click="onModelItemClicked(model)"
    />
    <button
      v-if="moreToLoad"
      class="bg-foundation-2 rounded p-1 hover:text-primary hover:bg-primary-muted transition cursor-pointer hover:shadow-md"
      @click="onFetchMoreClick()"
    >
      Load more
    </button>
  </div>
</template>

<script setup lang="ts">
import type {
  ProjectLatestModelsPaginationQueryVariables,
  ProjectPageLatestItemsModelItemFragment,
  ProjectAccSyncItemFragment
} from '~/lib/common/generated/gql/graphql'
import {
  latestModelsQuery,
  latestModelsPaginationQuery
} from '~/lib/projects/graphql/queries'
import { useQuery } from '@vue/apollo-composable'
import type { Nullable } from '@speckle/shared'

const props = defineProps<{
  projectId: string
  accSyncItems: ProjectAccSyncItemFragment[] | undefined
}>()

const emit = defineEmits(['model-selected'])

const selectedModel = ref<ProjectPageLatestItemsModelItemFragment>()
const searchText = ref<string>()
const newModelName = ref<string>()
watch(searchText, () => (newModelName.value = searchText.value as string))

const latestModelsQueryVariables = computed(
  (): ProjectLatestModelsPaginationQueryVariables => {
    const shouldHaveFilter = searchText.value && searchText.value.length > 0
    return {
      projectId: props.projectId,
      filter: shouldHaveFilter
        ? {
            search: searchText.value || null
          }
        : null
    }
  }
)

// Base query (all pending uploads + first page of models)
const { result: baseResult } = useQuery(
  latestModelsQuery,
  () => latestModelsQueryVariables.value
)

// Pagination query
const {
  result: extraPagesResult,
  fetchMore: fetchMorePages,
  loading
} = useQuery(
  latestModelsPaginationQuery,
  () => ({
    ...latestModelsQueryVariables.value,
    limit: 10,
    cursor: null as Nullable<string>
  }),
  () => ({ enabled: true })
)

const models = computed(() =>
  extraPagesResult.value
    ? extraPagesResult.value?.project?.models?.items || []
    : baseResult.value?.project?.models?.items || []
)
const totalCount = computed(() => models.value?.length)

const moreToLoad = computed(
  () =>
    !baseResult.value?.project ||
    baseResult.value.project.models.items.length <
      baseResult.value.project.models.totalCount
)

const onFetchMoreClick = async () => {
  const cursor =
    extraPagesResult.value?.project?.models.cursor ||
    baseResult.value?.project?.models.cursor ||
    null
  await fetchMorePages({
    variables: {
      cursor
    }
  })
}

const onModelItemClicked = (model: ProjectPageLatestItemsModelItemFragment) => {
  selectedModel.value = model
  emit('model-selected', model)
}
</script>
