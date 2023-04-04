<template>
  <div v-if="treeItemCount" class="space-y-4 mb-14 max-w-full">
    <div v-for="item in topLevelItems" :key="item.fullName">
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
    v-else-if="search && (treeTopLevelResult?.project?.modelsTree || []).length === 0"
    @clear-search="$emit('clear-search')"
  />
  <div v-else>TODO: List empty state</div>
</template>
<script setup lang="ts">
import {
  ProjectPageLatestItemsModelsFragment,
  SingleLevelModelTreeItemFragment
} from '~~/lib/common/generated/gql/graphql'
import { useQuery, useQueryLoading } from '@vue/apollo-composable'
import { projectModelsTreeTopLevelQuery } from '~~/lib/projects/graphql/queries'
import { canModifyModels } from '~~/lib/projects/helpers/permissions'

const emit = defineEmits<{
  (e: 'update:loading', v: boolean): void
  (e: 'clear-search'): void
}>()

const props = defineProps<{
  project: ProjectPageLatestItemsModelsFragment
  search?: string
}>()

const areQueriesLoading = useQueryLoading()
const projectId = computed(() => props.project.id)

const {
  result: treeTopLevelResult,
  refetch: refetchTree,
  variables: resultVariables
} = useQuery(projectModelsTreeTopLevelQuery, () => ({
  projectId: projectId.value,
  filter: props.search ? { search: props.search } : undefined
}))

const topLevelItems = computed(
  (): SingleLevelModelTreeItemFragment[] =>
    treeTopLevelResult.value?.project?.modelsTree || []
)
const treeItemCount = computed(() => topLevelItems.value.length)
const canContribute = computed(() => canModifyModels(props.project))
const isUsingSearch = computed(() => !!resultVariables.value?.filter?.search)

const onModelUpdated = () => refetchTree()

watch(areQueriesLoading, (newVal) => {
  emit('update:loading', newVal)
})
</script>
