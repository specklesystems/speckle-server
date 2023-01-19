<template>
  <ProjectPageLatestItems :count="project.modelCount" title="Models">
    <template #default="{ gridOrList }">
      <ProjectPageLatestItemsModelsGrid
        v-if="gridOrList === GridListToggleValue.Grid"
        :models="latestModelsResult"
      />
      <ProjectPageLatestItemsModelsList v-else :models="latestModelsResult" />
    </template>
    <template #filters>
      <div class="flex flex-row space-x-4">
        <FormSelectUsers
          v-model="selectedMembers"
          :users="project.team"
          :disabled="isQueryLoading"
          multiple
          search
          selector-placeholder="All members"
          label="Filter by members"
          class="grow shrink w-[100px] lg:w-56"
        />
        <FormSelectSourceApps
          v-model="selectedApps"
          :items="availableSourceApps"
          :disabled="isQueryLoading"
          multiple
          selector-placeholder="All sources"
          label="Filter by sources"
          class="grow shrink w-[100px] lg:w-44"
        />
      </div>
    </template>
  </ProjectPageLatestItems>
</template>
<script setup lang="ts">
import { GridListToggleValue } from '~~/lib/layout/helpers/components'
import {
  FormUsersSelectItemFragment,
  ProjectPageLatestItemsModelsFragment
} from '~~/lib/common/generated/gql/graphql'
import { SourceAppDefinition, SourceApps } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery, useQueryLoading } from '@vue/apollo-composable'
import { latestModelsQuery } from '~~/lib/projects/graphql/queries'

graphql(`
  fragment ProjectPageLatestItemsModels on Project {
    id
    modelCount
    sourceApps
    team {
      ...FormUsersSelectItem
    }
  }
`)

const props = defineProps<{
  project: ProjectPageLatestItemsModelsFragment
}>()

const selectedMembers = ref([] as FormUsersSelectItemFragment[])
const selectedApps = ref([] as SourceAppDefinition[])

const isQueryLoading = useQueryLoading()
const { result: latestModelsResult } = useQuery(latestModelsQuery, () => ({
  projectId: props.project.id,
  filter: {
    sourceApps: selectedApps.value?.length
      ? selectedApps.value.map((a) => a.searchKey)
      : null,
    contributors: selectedMembers.value?.length
      ? selectedMembers.value.map((m) => m.id)
      : null
  }
}))

const availableSourceApps = computed((): SourceAppDefinition[] =>
  SourceApps.filter((a) =>
    props.project.sourceApps.find((pa) => pa.includes(a.searchKey))
  )
)
</script>
