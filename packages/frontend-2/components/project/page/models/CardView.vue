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
    v-else-if="search && latestModelsResult?.project?.models.items.length === 0"
    @clear-search="() => $emit('clear-search')"
  />
  <div v-else>TODO: Grid empty state</div>
</template>
<script setup lang="ts">
import { ProjectPageModelsViewFragment } from '~~/lib/common/generated/gql/graphql'
import { useQuery, useQueryLoading } from '@vue/apollo-composable'
import { latestModelsQuery } from '~~/lib/projects/graphql/queries'

const emit = defineEmits<{
  (e: 'update:loading', v: boolean): void
  (e: 'model-clicked', v: { id: string; e: MouseEvent }): void
  (e: 'clear-search'): void
}>()

const props = withDefaults(
  defineProps<{
    project: ProjectPageModelsViewFragment
    search?: string
    showActions?: boolean
    showVersions?: boolean
    disableDefaultLinks?: boolean
    excludedIds?: string[]
  }>(),
  {
    showActions: true,
    showVersions: true
  }
)

const areQueriesLoading = useQueryLoading()
const { result: latestModelsResult } = useQuery(latestModelsQuery, () => ({
  projectId: props.project.id,
  filter: {
    search: props.search || null,
    excludeIds: props.excludedIds || null
  }
}))

const items = computed(() => latestModelsResult.value?.project?.models?.items || [])
const itemsCount = computed(() => items.value.length)

watch(areQueriesLoading, (newVal) => {
  emit('update:loading', newVal)
})
</script>
