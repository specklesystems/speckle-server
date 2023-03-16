<template>
  <div v-if="treeItemCount" class="space-y-4 mb-14 max-w-full">
    <div v-for="item in topLevelItems" :key="item.fullName">
      <ProjectPageModelsStructureItem
        :item="item"
        :project-id="projectId"
        :can-contribute="canContribute"
        @model-updated="onModelUpdated"
      />
    </div>
    <ProjectPageModelsNewModelStructureItem
      v-if="canContribute"
      :project-id="projectId"
    />
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
import { canModifyModels } from '~~/lib/projects/helpers/permissions'

const props = defineProps<{
  project: ProjectPageModelsViewFragment
}>()

const projectId = computed(() => props.project.id)

const { result: treeTopLevelResult, refetch: refetchTree } = useQuery(
  projectModelsTreeTopLevelQuery,
  () => ({
    projectId: projectId.value
  })
)

const topLevelItems = computed(
  (): SingleLevelModelTreeItemFragment[] =>
    treeTopLevelResult.value?.project?.modelsTree || []
)
const treeItemCount = computed(() => topLevelItems.value.length)

const canContribute = computed(() => canModifyModels(props.project))

const onModelUpdated = () => refetchTree()
</script>
