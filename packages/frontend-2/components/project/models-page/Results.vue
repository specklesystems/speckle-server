<template>
  <div>
    <div>
      <ProjectPageModelsListView
        v-if="gridOrList === GridListToggleValue.List"
        :search="finalSearch"
        :project="project"
        :source-apps="sourceApps"
        :contributors="contributors"
        @update:loading="finalLoading = $event"
        @clear-search="clearSearch"
      />
      <ProjectPageModelsCardView
        v-if="gridOrList === GridListToggleValue.Grid"
        :search="finalSearch"
        :project="project"
        :source-apps="sourceApps"
        :contributors="contributors"
        @update:loading="finalLoading = $event"
        @clear-search="clearSearch"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { SourceAppDefinition } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import {
  FormUsersSelectItemFragment,
  ProjectModelsPageResults_ProjectFragment
} from '~~/lib/common/generated/gql/graphql'
import { GridListToggleValue } from '~~/lib/layout/helpers/components'

graphql(`
  fragment ProjectModelsPageResults_Project on Project {
    ...ProjectPageLatestItemsModels
  }
`)

const emit = defineEmits<{
  (e: 'update:search', val: string): void
  (e: 'update:loading', val: boolean): void
  (e: 'clear-search'): void
}>()

const props = defineProps<{
  project: ProjectModelsPageResults_ProjectFragment
  search: string
  gridOrList: GridListToggleValue
  loading: boolean
  sourceApps: SourceAppDefinition[]
  contributors: FormUsersSelectItemFragment[]
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
  emit('clear-search')
}
</script>
