<template>
  <div>
    <div v-if="project">
      <ProjectsInviteBanner v-if="invite" :invite="invite" :show-stream-name="false" />
      <!-- Heading text w/ actions -->
      <ProjectPageHeader :project="project" class="mb-8" />
      <!-- Stats blocks -->
      <div class="flex flex-col md:flex-row space-y-2 md:space-x-4 mb-14">
        <ProjectPageStatsBlockTeam
          :project="project"
          class="shadow hover:shadow-xl w-full md:w-72 transition"
        />
        <div class="grow hidden md:flex"></div>
        <div class="grid grid-cols-3 gap-2">
          <ProjectPageStatsBlockVersions :project="project" />
          <ProjectPageStatsBlockModels :project="project" />
          <ProjectPageStatsBlockComments :project="project" />
        </div>
      </div>
      <div class="flex flex-col space-y-14">
        <!-- Latest models -->
        <ProjectPageLatestItemsModels :project="project" />
        <!-- Latest comments -->
        <ProjectPageLatestItemsComments :project="project" />
        <!-- More actions -->
        <!-- <ProjectPageMoreActions /> -->
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { Optional } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import { projectPageQuery } from '~~/lib/projects/graphql/queries'
import { useGeneralProjectPageUpdateTracking } from '~~/lib/projects/composables/projectPages'

graphql(`
  fragment ProjectPageProject on Project {
    id
    createdAt
    ...ProjectPageProjectHeader
    ...ProjectPageStatsBlockTeam
    ...ProjectPageTeamDialog
    ...ProjectPageStatsBlockVersions
    ...ProjectPageStatsBlockModels
    ...ProjectPageStatsBlockComments
    ...ProjectPageLatestItemsModels
    ...ProjectPageLatestItemsComments
  }
`)

definePageMeta({
  middleware: ['require-valid-project']
})

const route = useRoute()
const projectId = computed(() => route.params.id as string)
useGeneralProjectPageUpdateTracking({ projectId }, { notifyOnProjectUpdate: true })
const { result: projectPageResult } = useQuery(
  projectPageQuery,
  () => ({
    id: projectId.value,
    token: (route.query.token as Optional<string>) || null
  }),
  () => ({
    // Custom error policy so that a failing invitedTeam resolver (due to access rights)
    // doesn't kill the entire query
    errorPolicy: 'all'
  })
)

const project = computed(() => projectPageResult.value?.project)
const invite = computed(() => projectPageResult.value?.projectInvite)
</script>
