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
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import {
  ProjectModelsUpdatedMessageType,
  ProjectUpdatedMessageType
} from '~~/lib/common/generated/gql/graphql'
import { useNavigateToHome, useNavigateToProject } from '~~/lib/common/helpers/route'
import { useProjectModelUpdateTracking } from '~~/lib/projects/composables/modelManagement'
import { useProjectUpdateTracking } from '~~/lib/projects/composables/projectManagement'
import {
  useProjectPendingVersionUpdateTracking,
  useProjectVersionUpdateTracking
} from '~~/lib/projects/composables/versionManagement'
import { projectModelPageQuery } from '~~/lib/projects/graphql/queries'

definePageMeta({
  middleware: ['require-valid-project', 'require-valid-model']
})

const route = useRoute()
const goToProject = useNavigateToProject()
const { triggerNotification } = useGlobalToast()
const goHome = useNavigateToHome()

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
  const { id } = event
  if (id !== modelId.value) return

  if (event.type === ProjectModelsUpdatedMessageType.Deleted) {
    // Redirect back to project home
    goToProject({ id: projectId.value })

    triggerNotification({
      type: ToastNotificationType.Info,
      title: 'Model has been deleted',
      description: 'Redirecting to project page home'
    })
  }
})
useProjectUpdateTracking(projectId, (event) => {
  const isDeleted = event.type === ProjectUpdatedMessageType.Deleted

  if (isDeleted) {
    goHome()

    triggerNotification({
      type: ToastNotificationType.Info,
      title: 'Project deleted',
      description: 'Redirecting to home'
    })
  }
})
</script>
