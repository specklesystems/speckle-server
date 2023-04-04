<template>
  <div>
    <CommonLoadingBar :loading="!!finalLoading" class="my-2" />
    <div :class="finalLoading ? 'hidden' : 'block'">
      <ProjectPageModelsListView
        v-if="gridOrList === GridListToggleValue.List"
        :search="finalSearch"
        :project="project"
        @update:loading="finalLoading = $event"
        @clear-search="clearSearch"
      />
      <ProjectPageModelsCardView
        v-if="gridOrList === GridListToggleValue.Grid"
        :search="finalSearch"
        :project="project"
        @update:loading="finalLoading = $event"
        @clear-search="clearSearch"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { ProjectModelsPageResults_ProjectFragment } from '~~/lib/common/generated/gql/graphql'
import { GridListToggleValue } from '~~/lib/layout/helpers/components'

graphql(`
  fragment ProjectModelsPageResults_Project on Project {
    ...ProjectPageLatestItemsModels
  }
`)

const emit = defineEmits<{
  (e: 'update:search', val: string): void
  (e: 'update:loading', val: boolean): void
}>()

const props = defineProps<{
  project: ProjectModelsPageResults_ProjectFragment
  search: string
  gridOrList: GridListToggleValue
  loading: boolean
}>()

const finalSearch = computed({
  get: () => props.search,
  set: (newVal) => emit('update:search', newVal)
})

const finalLoading = computed({
  get: () => props.loading,
  set: (newVal) => emit('update:loading', newVal)
})

const clearSearch = () => {
  finalSearch.value = ''
  finalLoading.value = true
}
</script>
