<template>
  <div>
    <div v-if="project">
      <ProjectModelPageHeader :project="project" />
      <ProjectModelPageVersions :project="project" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { ProjectModelsUpdatedMessageType } from '~~/lib/common/generated/gql/graphql'
import { useNavigateToProject } from '~~/lib/common/helpers/route'
import { useProjectModelUpdateTracking } from '~~/lib/projects/composables/modelManagement'
import {
  useProjectPendingVersionUpdateTracking,
  useProjectVersionUpdateTracking
} from '~~/lib/projects/composables/versionManagement'
import { projectModelPageQuery } from '~~/lib/projects/graphql/queries'

/**
 * SPLIT THINGS UP INTO COMPONENT FRAGMENTS
 */

definePageMeta({
  middleware: ['require-valid-project', 'require-valid-model']
})

const route = useRoute()
const goToProject = useNavigateToProject()

const projectId = computed(() => route.params.id as string)
const modelId = computed(() => route.params.modelId as string)
const { result: pageData } = useQuery(projectModelPageQuery, () => ({
  projectId: projectId.value,
  modelId: modelId.value
}))

const project = computed(() => pageData.value?.project)

useProjectPendingVersionUpdateTracking(projectId.value)
useProjectVersionUpdateTracking(projectId.value)
useProjectModelUpdateTracking(projectId.value, (event) => {
  const model = event.model
  if (model?.id !== modelId.value) return

  if (event.type === ProjectModelsUpdatedMessageType.Deleted) {
    // Redirect back to project home
    goToProject({ id: projectId.value })
  }
})
</script>
