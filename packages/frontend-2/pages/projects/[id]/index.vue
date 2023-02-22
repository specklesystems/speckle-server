<template>
  <div>
    <div v-if="project">
      <!-- Heading text w/ actions -->
      <ProjectPageHeader :project="project" class="mb-8" />
      <!-- Stats blocks -->
      <div class="flex flex-col md:flex-row space-y-2 md:space-x-4 mb-14">
        <ProjectPageStatsBlockTeam
          :project="project"
          class="shadow hover:shadow-xl w-full md:w-72 transition"
        />
        <div class="grow hidden md:flex"></div>
        <ProjectPageStatsBlockVersions :project="project" />
        <ProjectPageStatsBlockModels :project="project" />
        <ProjectPageStatsBlockComments :project="project" />
      </div>
      <div class="flex flex-col space-y-14">
        <!-- Latest models -->
        <ProjectPageModelsView :project="project" />
        <!-- Latest comments -->
        <ProjectPageLatestItemsComments :project="project" />
        <!-- More actions -->
        <ProjectPageMoreActions />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { graphql } from '~~/lib/common/generated/gql'
import {
  ProjectModelsUpdatedMessageType,
  ProjectUpdatedMessageType
} from '~~/lib/common/generated/gql/graphql'
import { useNavigateToHome } from '~~/lib/common/helpers/route'
import {
  useEvictProjectModelFields,
  useProjectModelUpdateTracking
} from '~~/lib/projects/composables/modelManagement'
import { useProjectUpdateTracking } from '~~/lib/projects/composables/projectManagement'
import { useProjectVersionUpdateTracking } from '~~/lib/projects/composables/versionManagement'
import { projectPageQuery } from '~~/lib/projects/graphql/queries'

graphql(`
  fragment ProjectPageProject on Project {
    id
    createdAt
    ...ProjectPageProjectHeader
    ...ProjectPageStatsBlockTeam
    ...ProjectPageStatsBlockVersions
    ...ProjectPageStatsBlockModels
    ...ProjectPageStatsBlockComments
    ...ProjectPageLatestItemsModels
    ...ProjectPageLatestItemsComments
    ...ProjectPageModelsView
  }
`)

definePageMeta({
  middleware: ['require-valid-project']
})

const evictProjectModels = useEvictProjectModelFields()
const { triggerNotification } = useGlobalToast()
const route = useRoute()
const goHome = useNavigateToHome()
const projectId = computed(() => route.params.id as string)

// update preview URLs
useProjectVersionUpdateTracking(projectId)

useProjectModelUpdateTracking(projectId, (event) => {
  // If creation, refresh all project's model fields
  if (event.type === ProjectModelsUpdatedMessageType.Created) {
    evictProjectModels(projectId.value)
  }
})

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

const { result: projectPageResult } = useQuery(projectPageQuery, () => ({
  id: projectId.value
}))

const project = computed(() => projectPageResult.value?.project)
</script>
