<template>
  <div>
    <div v-if="project">
      <ProjectDiscussionsPageHeader
        v-model:grid-or-list="gridOrList"
        :project="project"
      />
      <ProjectDiscussionsPageResults :grid-or-list="gridOrList" :project="project" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { ProjectUpdatedMessageType } from '~~/lib/common/generated/gql/graphql'
import { useNavigateToHome } from '~~/lib/common/helpers/route'
import { useProjectPageItemViewType } from '~~/lib/projects/composables/layout'
import { useProjectUpdateTracking } from '~~/lib/projects/composables/projectManagement'
import { projectDiscussionsPageQuery } from '~~/lib/projects/graphql/queries'

definePageMeta({
  middleware: ['require-valid-project']
})

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const { result } = useQuery(projectDiscussionsPageQuery, () => ({
  projectId: projectId.value
}))
const goHome = useNavigateToHome()
const { triggerNotification } = useGlobalToast()
const gridOrList = useProjectPageItemViewType('Discussions')

const project = computed(() => result.value?.project)

useProjectUpdateTracking(projectId, (event) => {
  const isDeleted = event.type === ProjectUpdatedMessageType.Deleted

  if (isDeleted) {
    goHome()
  }

  triggerNotification({
    type: ToastNotificationType.Info,
    title: isDeleted ? 'Project deleted' : 'Project updated',
    description: isDeleted ? 'Redirecting to home' : undefined
  })
})
</script>
