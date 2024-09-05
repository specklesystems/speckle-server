<template>
  <div>
    <div>
      <ProjectPageModelsListView
        v-if="gridOrList === GridListToggleValue.List"
        :search="finalSearch"
        :project="project"
        :project-id="projectId"
        :source-apps="sourceApps"
        :contributors="contributors"
        @update:loading="finalLoading = $event"
        @clear-search="clearSearch"
      />
      <ProjectPageModelsCardView
        v-if="gridOrList === GridListToggleValue.Grid"
        :search="finalSearch"
        :project="project"
        :project-id="projectId"
        :source-apps="sourceApps"
        :contributors="contributors"
        :disable-default-links="false"
        @update:loading="finalLoading = $event"
        @clear-search="clearSearch"
        @model-clicked="(val) => router.push(modelRoute(projectId, val.id))"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import type { SourceAppDefinition } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import type {
  FormUsersSelectItemFragment,
  ProjectModelsPageResults_ProjectFragment
} from '~~/lib/common/generated/gql/graphql'
import { GridListToggleValue } from '~~/lib/layout/helpers/components'
import { modelRoute } from '~~/lib/common/helpers/route'

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
  projectId: string
  project?: ProjectModelsPageResults_ProjectFragment
  search: string
  gridOrList: GridListToggleValue
  loading: boolean
  sourceApps: SourceAppDefinition[]
  contributors: FormUsersSelectItemFragment[]
}>()

const router = useRouter()

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
