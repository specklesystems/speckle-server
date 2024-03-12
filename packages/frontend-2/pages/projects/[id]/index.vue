<template>
  <div>
    <template v-if="project">
      <ProjectsInviteBanner
        :invite="invite"
        :show-stream-name="false"
        :auto-accept="shouldAutoAcceptInvite"
        @processed="onInviteAccepted"
      />
      <div
        class="flex flex-col md:flex-row md:justify-between md:items-start gap-8 sm:gap-4 my-8"
      >
        <ProjectPageHeader :project="project" />
        <ProjectPageStatsBlockSettings
          :project="project"
          class="w-full md:w-72 shrink-0"
        />
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
import { LayoutPageTabs, type LayoutPageTabItem } from '@speckle/ui-components'
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

const pageTabItems = computed((): LayoutPageTabItem[] => [
  {
    title: 'Models',
    id: 'models',
    icon: CubeIcon,
    count: modelCount.value
  },
  {
    title: 'Discussions',
    id: 'discussions',
    icon: ChatBubbleLeftRightIcon,
    count: commentCount.value
  }
  // {
  //   title: 'Automations',
  //   id: 'automations',
  //   icon: BoltIcon,
  //   tag: 'New'
  // }
])
</script>
