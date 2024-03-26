<template>
  <div>
    <div v-if="project">
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
      <LayoutPageTabs v-model:active-item="activePageTab" :items="pageTabItems">
        <NuxtPage />
      </LayoutPageTabs>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useApolloClient, useQuery } from '@vue/apollo-composable'
import type { Optional } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import {
  projectDiscussionsPageQuery,
  projectModelsPageQuery,
  projectPageQuery
} from '~~/lib/projects/graphql/queries'
import { useGeneralProjectPageUpdateTracking } from '~~/lib/projects/composables/projectPages'
import { LayoutPageTabs, type LayoutPageTabItem } from '@speckle/ui-components'
import { CubeIcon, ChatBubbleLeftRightIcon, BoltIcon } from '@heroicons/vue/24/outline'
import { projectRoute } from '~/lib/common/helpers/route'
import { convertThrowIntoFetchResult } from '~/lib/common/helpers/graphql'

graphql(`
  fragment ProjectPageProject on Project {
    id
    createdAt
    ...ProjectPageProjectHeader
    ...ProjectPageStatsBlockTeam
    ...ProjectPageTeamDialog
    ...ProjectPageStatsBlockModels
    ...ProjectPageStatsBlockComments
  }
`)

definePageMeta({
  middleware: [
    'require-valid-project',
    function (to) {
      // Redirect from /projects/:id/models to /projects/:id
      const projectId = to.params.id as string
      if (/\/models\/?$/i.test(to.path)) {
        return navigateTo(projectRoute(projectId))
      }
    }
  ],
  alias: '/projects/:id/models'
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
    ...(token.value?.length ? { token: token.value } : {})
  }),
  () => ({
    // Custom error policy so that a failing invitedTeam resolver (due to access rights)
    // doesn't kill the entire query
    errorPolicy: 'all'
    // context: {
    //   skipLoggingErrors: (err) =>
    //     err.graphQLErrors?.length === 1 &&
    //     err.graphQLErrors.some((e) => !!e.path?.includes('invitedTeam'))
    // }
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
  },
  {
    title: 'Automations',
    id: 'automations',
    icon: BoltIcon,
    tag: 'New'
  }
])

const activePageTab = computed({
  get: () => {
    const path = router.currentRoute.value.path
    if (/\/discussions\/?$/i.test(path)) return pageTabItems.value[1]
    if (/\/automations\/?$/i.test(path)) return pageTabItems.value[2]
    return pageTabItems.value[0]
  },
  set: (val: LayoutPageTabItem) => {
    switch (val.id) {
      case 'models':
        router.push({ path: projectRoute(projectId.value, 'models') })
        break
      case 'discussions':
        router.push({ path: projectRoute(projectId.value, 'discussions') })
        break
      case 'automations':
        router.push({ path: projectRoute(projectId.value, 'automations') })
        break
    }
  }
})

if (process.server) {
  /**
   * There seems to be some sort of vue/nuxt bug where Apollo queries in tabs cause
   * weird hydration mismatches. Honestly I've no idea wtf is happening, but if we preload
   * those queries from the root page it seems to work. This is a hack, but it works.
   *
   * Hopefully we can figure this out at some point, cause this is quite nasty
   */

  const serverActiveTab = activePageTab.value
  const client = useApolloClient().client

  if (serverActiveTab.id === 'models') {
    await client
      .query({
        query: projectModelsPageQuery,
        variables: {
          projectId: projectId.value
        }
      })
      .catch(convertThrowIntoFetchResult)
  } else if (serverActiveTab.id === 'discussions') {
    await client
      .query({
        query: projectDiscussionsPageQuery,
        variables: {
          projectId: projectId.value
        }
      })
      .catch(convertThrowIntoFetchResult)
  }
}
</script>
