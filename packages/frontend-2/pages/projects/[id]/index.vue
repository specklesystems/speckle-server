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
import { useApolloClient, useQuery, useSubscription } from '@vue/apollo-composable'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { graphql } from '~~/lib/common/generated/gql'
import {
  ProjectPageQueryQueryVariables,
  ProjectUpdatedMessageType
} from '~~/lib/common/generated/gql/graphql'
import { getCacheId, updateCacheByFilter } from '~~/lib/common/helpers/graphql'
import { useNavigateToHome } from '~~/lib/common/helpers/route'
import { projectPageQuery } from '~~/lib/projects/graphql/queries'

const onProjectUpdatedSubscription = graphql(`
  subscription OnProjectUpdated($id: String!) {
    projectUpdated(id: $id) {
      id
      type
      project {
        ...ProjectPageProject
      }
    }
  }
`)

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

const { triggerNotification } = useGlobalToast()
const route = useRoute()
const goHome = useNavigateToHome()
const apollo = useApolloClient().client
const projectId = computed(() => route.params.id as string)
const { result: projectPageResult } = useQuery(projectPageQuery, () => ({
  id: projectId.value
}))

const { onResult: onProjectUpdated } = useSubscription(
  onProjectUpdatedSubscription,
  () => ({
    id: projectId.value
  })
)

const project = computed(() => projectPageResult.value?.project)

onProjectUpdated((res) => {
  if (!res.data?.projectUpdated) return

  const event = res.data.projectUpdated
  const isDeleted = event.type === ProjectUpdatedMessageType.Deleted
  const updatedProject = event.project
  const cache = apollo.cache

  if (isDeleted) {
    goHome()
    cache.evict({
      id: getCacheId('Project', event.id)
    })
  } else if (updatedProject) {
    updateCacheByFilter(
      cache,
      {
        query: {
          query: projectPageQuery,
          variables: <ProjectPageQueryQueryVariables>{ id: updatedProject.id }
        }
      },
      (data) => {
        if (!data.project) return

        return {
          ...data,
          project: updatedProject
        }
      }
    )
  }

  triggerNotification({
    type: ToastNotificationType.Info,
    title: isDeleted ? 'Project deleted' : 'Project updated',
    description: isDeleted ? 'Redirecting to home' : undefined
  })
})
</script>
