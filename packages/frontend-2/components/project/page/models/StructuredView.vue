<template>
  <div v-if="treeItemCount" class="space-y-4 mb-14 max-w-full">
    <div v-for="item in topLevelItems" :key="item.fullName">
      <ProjectPageModelsStructureItem :item="item" :project-id="projectId" />
    </div>
  </div>
  <div v-else>TODO: List empty state</div>
</template>
<script setup lang="ts">
import {
  ProjectPageModelsViewFragment,
  SingleLevelModelTreeItemFragment
} from '~~/lib/common/generated/gql/graphql'
import { useQuery } from '@vue/apollo-composable'
import { projectModelsTreeTopLevelQuery } from '~~/lib/projects/graphql/queries'

const props = defineProps<{
  project: ProjectPageModelsViewFragment
}>()

const projectId = computed(() => props.project.id)

const { result: treeTopLevelResult } = useQuery(projectModelsTreeTopLevelQuery, () => ({
  projectId: projectId.value
}))

const topLevelItems = computed(
  (): SingleLevelModelTreeItemFragment[] =>
    treeTopLevelResult.value?.project?.modelsTree || []
)
const treeItemCount = computed(() => topLevelItems.value.length)
</script>
