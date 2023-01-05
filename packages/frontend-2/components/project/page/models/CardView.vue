<template>
  <div v-if="itemsCount" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
    <ProjectPageModelsCard
      v-for="item in items"
      :key="item.id"
      :model="item"
      :project-id="projectId"
    />
  </div>
  <div v-else>TODO: Grid empty state</div>
</template>
<script setup lang="ts">
import { ProjectPageModelsViewFragment } from '~~/lib/common/generated/gql/graphql'
import { useQuery } from '@vue/apollo-composable'
import { latestModelsQuery } from '~~/lib/projects/graphql/queries'

const props = defineProps<{
  project: ProjectPageModelsViewFragment
}>()

const projectId = computed(() => props.project.id)

const { result: latestModelsResult } = useQuery(latestModelsQuery, () => ({
  projectId: props.project.id
}))

const items = computed(() => latestModelsResult.value?.project?.models?.items || [])
const itemsCount = computed(() => items.value.length)
</script>
