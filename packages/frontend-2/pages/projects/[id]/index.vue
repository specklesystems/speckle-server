<template>
  <div>
    <div v-if="project">
      <ProjectsInviteBanner
        v-if="invite"
        :invite="invite"
        :show-project-name="false"
        @processed="onInviteAccepted"
      />
      <div
        class="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mt-2 mb-6"
      >
        <ProjectPageHeader :project="project" />
        <div class="flex gap-x-3 items-center justify-between">
          <div class="flex flex-row gap-x-3">
            <CommonBadge rounded :color-classes="'text-foreground-2 bg-primary-muted'">
              {{ project.modelCount.totalCount || 0 }} Model{{
                project.modelCount.totalCount === 1 ? '' : 's'
              }}
            </CommonBadge>
            <CommonBadge
              v-if="project.role"
              rounded
              :color-classes="'text-foreground-2 bg-primary-muted'"
            >
              <span class="capitalize">
                {{ project.role?.split(':').reverse()[0] }}
              </span>
            </CommonBadge>
          </div>
          <div class="flex flex-row gap-x-3">
            <UserAvatarGroup :users="teamUsers" class="max-w-[104px]" />
            <FormButton
              v-if="canEdit"
              color="outline"
              :to="projectCollaboratorsRoute(project.id)"
            >
              Manage
            </FormButton>
          </div>
        </div>
      </div>
      <LayoutTabsHorizontal v-model:active-item="activePageTab" :items="pageTabItems">
        <NuxtPage :project="project" />
      </LayoutTabsHorizontal>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { Roles, type Optional } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import { projectPageQuery } from '~~/lib/projects/graphql/queries'
import { useGeneralProjectPageUpdateTracking } from '~~/lib/projects/composables/projectPages'
import { LayoutTabsHorizontal, type LayoutPageTabItem } from '@speckle/ui-components'
import { projectRoute, projectWebhooksRoute } from '~/lib/common/helpers/route'
import { canEditProject } from '~~/lib/projects/helpers/permissions'
import { projectCollaboratorsRoute } from '~~/lib/common/helpers/route'

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
    ...ProjectPageTeamInternals_Project
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
    fetchPolicy: pageFetchPolicy.value
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
const canEdit = computed(() => (project.value ? canEditProject(project.value) : false))
const teamUsers = computed(() => project.value?.team.map((t) => t.user))

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
      count: modelCount.value
    },
    {
      title: 'Discussions',
      id: 'discussions',
      count: commentCount.value
    }
  ]

  if (isOwner.value && isAutomateEnabled.value) {
    items.push({
      title: 'Automations',
      id: 'automations',
      tag: 'Beta'
    })
  }

  if (hasRole.value) {
    items.push({
      title: 'Settings',
      id: 'settings'
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
