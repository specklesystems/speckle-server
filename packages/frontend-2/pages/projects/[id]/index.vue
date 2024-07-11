<template>
  <div>
    <div v-if="project">
      <ProjectsInviteBanner
        :invite="invite"
        :show-project-name="false"
        @processed="onInviteAccepted"
      />
      <div
        class="flex flex-col md:flex-row md:justify-between md:items-start gap-8 my-8"
      >
        <ProjectPageHeader :project="project" />
        <ProjectPageTeamBlock :project="project" class="w-full md:w-72 shrink-0" />
      </div>
      <LayoutTabsHoriztonal v-model:active-item="activePageTab" :items="pageTabItems">
        <NuxtPage :project="project" />
      </LayoutTabsHoriztonal>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { Roles, type Optional } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import { projectPageQuery } from '~~/lib/projects/graphql/queries'
import { useGeneralProjectPageUpdateTracking } from '~~/lib/projects/composables/projectPages'
import { LayoutTabsHoriztonal, type LayoutPageTabItem } from '@speckle/ui-components'
import {
  CubeIcon,
  ChatBubbleLeftRightIcon,
  BoltIcon,
  Cog6ToothIcon
} from '@heroicons/vue/24/outline'
import { projectRoute, projectWebhooksRoute } from '~/lib/common/helpers/route'

graphql(`
  fragment ProjectPageProject on Project {
    id
    createdAt
    modelCount: models(limit: 0) {
      totalCount
    }
    commentThreadCount: commentThreads(limit: 0) {
      totalCount
    }
    ...ProjectPageProjectHeader
    ...ProjectPageTeamDialog
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

      // Redirect from /projects/:id/webhooks to /projects/:id/settings/webhooks
      if (/\/projects\/\w*?\/webhooks/i.test(to.path)) {
        return navigateTo(projectWebhooksRoute(projectId))
      }
    }
  ],
  alias: ['/projects/:id/models', '/projects/:id/webhooks']
})

const route = useRoute()
const router = useRouter()
const projectId = computed(() => route.params.id as string)
const token = computed(() => route.query.token as Optional<string>)

const pageFetchPolicy = usePageQueryStandardFetchPolicy()
useGeneralProjectPageUpdateTracking({ projectId }, { notifyOnProjectUpdate: true })
const { result: projectPageResult } = useQuery(
  projectPageQuery,
  () => ({
    id: projectId.value,
    ...(token.value?.length ? { token: token.value } : {})
  }),
  () => ({
    fetchPolicy: pageFetchPolicy.value,
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
const hasRole = computed(() => project.value?.role)

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

const isOwner = computed(() => project.value?.role === Roles.Stream.Owner)
const isAutomateEnabled = useIsAutomateModuleEnabled()

const pageTabItems = computed((): LayoutPageTabItem[] => {
  const items: LayoutPageTabItem[] = [
    {
      title: 'Models',
      id: 'models',
      count: modelCount.value,
      icon: CubeIcon
    },
    {
      title: 'Discussions',
      id: 'discussions',
      count: commentCount.value,
      icon: ChatBubbleLeftRightIcon
    }
  ]

  if (isOwner.value && isAutomateEnabled.value) {
    items.push({
      title: 'Automations',
      id: 'automations',
      icon: BoltIcon,
      tag: 'Beta'
    })
  }

  if (hasRole.value) {
    items.push({
      title: 'Settings',
      id: 'settings',
      icon: Cog6ToothIcon
    })
  }

  return items
})

const findTabById = (id: string) =>
  pageTabItems.value.find((tab) => tab.id === id) || pageTabItems.value[0]

const activePageTab = computed({
  get: () => {
    const path = router.currentRoute.value.path
    if (/\/discussions\/?$/i.test(path)) return findTabById('discussions')
    if (/\/automations\/?.*$/i.test(path)) return findTabById('automations')
    if (/\/settings\/?/i.test(path) && hasRole.value) return findTabById('settings')
    return findTabById('models')
  },
  set: (val: LayoutPageTabItem) => {
    if (!val) return
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
      case 'settings':
        if (hasRole.value) {
          router.push({ path: projectRoute(projectId.value, 'settings') })
        }
        break
    }
  }
})
</script>
