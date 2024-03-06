<template>
  <div>
    <template v-if="project">
      <ProjectsInviteBanner
        :invite="invite"
        :show-stream-name="false"
        :auto-accept="shouldAutoAcceptInvite"
        @processed="onInviteAccepted"
      />
      <!-- Heading text w/ actions -->
      <ProjectPageHeader :project="project" />
      <!-- Stats blocks -->
      <div class="flex flex-col md:flex-row space-y-2 md:space-x-4 mt-8 mb-14">
        <ProjectPageStatsBlockSettings
          :project="project"
          class="w-full md:w-72 transition"
        />
        <div class="grow hidden md:flex"></div>
        <div class="grid grid-cols-3 gap-2">
          <ProjectPageStatsBlockVersions :project="project" />
          <ProjectPageStatsBlockModels :project="project" />
          <ProjectPageStatsBlockComments :project="project" />
        </div>
      </div>
    </template>
    <!-- No v-if=project to ensure internal queries trigger ASAP -->
    <LayoutPageTabs v-if="project" v-slot="{ activeItem }" :items="pageTabItems">
      <ProjectPageModelsTab v-if="activeItem.id === 'models'" />
      <ProjectPageDiscussionsTab v-if="activeItem.id === 'discussions'" />
      <!-- <ProjectPageAutomationsTab v-if="activeItem.id === 'automations'" /> -->
    </LayoutPageTabs>
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import type { Optional } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import { projectPageQuery } from '~~/lib/projects/graphql/queries'
import { useGeneralProjectPageUpdateTracking } from '~~/lib/projects/composables/projectPages'
import { LayoutPageTabs } from '@speckle/ui-components'
import { CubeIcon, ChatBubbleLeftRightIcon } from '@heroicons/vue/24/outline'

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
const router = useRouter()
const projectId = computed(() => route.params.id as string)
const shouldAutoAcceptInvite = computed(() => route.query.accept === 'true')
const token = computed(() => route.query.token as Optional<string>)

useGeneralProjectPageUpdateTracking({ projectId }, { notifyOnProjectUpdate: true })
const { result: projectPageResult } = useQuery(
  projectPageQuery,
  () => ({
    id: projectId.value,
    token: token.value
  }),
  () => ({
    // Custom error policy so that a failing invitedTeam resolver (due to access rights)
    // doesn't kill the entire query
    errorPolicy: 'all',
    context: {
      skipLoggingErrors: (err) =>
        err.graphQLErrors?.length === 1 &&
        err.graphQLErrors.some((e) => !!e.path?.includes('invitedTeam'))
    }
  })
)

const project = computed(() => projectPageResult.value?.project)
const invite = computed(() => projectPageResult.value?.projectInvite || undefined)
const projectName = computed(() =>
  project.value?.name.length ? project.value.name : ''
)
const modelCount = computed(() => project.value?.modelCount.totalCount)
const commentCount = computed(() => project.value?.commentThreadCount.totalCount)

useHead({
  title: projectName
})

const onInviteAccepted = async (params: { accepted: boolean }) => {
  if (params.accepted) {
    await router.replace({
      query: { ...route.query, accept: undefined, token: undefined }
    })
  }
}

const pageTabItems: LayoutPageTabItem[] = [
  {
    title: 'Models',
    id: 'models',
    icon: CubeIcon,
    count: modelCount
  },
  {
    title: 'Discussions',
    id: 'discussions',
    icon: ChatBubbleLeftRightIcon,
    count: commentCount
  }
  // {
  //   title: 'Automations',
  //   id: 'automations',
  //   icon: BoltIcon,
  //   tag: 'New'
  // }
]
</script>
