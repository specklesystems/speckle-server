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
            <div v-tippy="collaboratorsTooltip">
              <NuxtLink :to="hasRole ? projectCollaboratorsRoute(project.id) : ''">
                <UserAvatarGroup
                  :users="teamUsers"
                  :max-count="2"
                  class="max-w-[104px]"
                  hide-tooltips
                />
              </NuxtLink>
            </div>
          </div>
          <LayoutMenu
            v-model:open="showActionsMenu"
            :items="actionsItems"
            :menu-position="HorizontalDirection.Left"
            :menu-id="menuId"
            @click.stop.prevent
            @chosen="onActionChosen"
          >
            <FormButton
              color="subtle"
              hide-text
              :icon-right="EllipsisHorizontalIcon"
              @click="showActionsMenu = !showActionsMenu"
            />
          </LayoutMenu>
        </div>
      </div>
      <LayoutTabsHorizontal v-model:active-item="activePageTab" :items="pageTabItems">
        <NuxtPage :project="project" />
      </LayoutTabsHorizontal>
    </div>

    <ProjectsMoveToWorkspaceDialog
      v-if="project"
      v-model:open="showMoveDialog"
      :project="project"
      event-source="project-page"
    />
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
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import { EllipsisHorizontalIcon } from '@heroicons/vue/24/solid'
import { HorizontalDirection } from '~~/lib/common/composables/window'
import { useCopyProjectLink } from '~~/lib/projects/composables/projectManagement'

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
    workspace {
      id
    }
    ...ProjectPageTeamInternals_Project
    ...ProjectPageProjectHeader
    ...ProjectPageTeamDialog
    ...ProjectsMoveToWorkspaceDialog_Project
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

enum ActionTypes {
  CopyLink = 'copy-link',
  Move = 'move'
}

const route = useRoute()
const router = useRouter()
const copyProjectLink = useCopyProjectLink()

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

const showActionsMenu = ref(false)
const menuId = useId()
const showMoveDialog = ref(false)

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
const actionsItems = computed<LayoutMenuItem[][]>(() => {
  const items: LayoutMenuItem[][] = [
    [
      {
        title: 'Copy link',
        id: ActionTypes.CopyLink
      }
    ]
  ]

  if (isWorkspacesEnabled.value && !project.value?.workspace?.id && hasRole.value) {
    items.push([
      {
        title: 'Move project...',
        id: ActionTypes.Move,
        disabled: !isOwner.value,
        disabledTooltip: 'Only the project owner can move this project into a workspace'
      }
    ])
  }

  return items
})

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
const isWorkspacesEnabled = useIsWorkspacesEnabled()

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

const collaboratorsTooltip = computed(() =>
  hasRole.value ? (canEdit.value ? 'Manage collaborators' : 'View collaborators') : null
)

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

const onActionChosen = (params: { item: LayoutMenuItem; event: MouseEvent }) => {
  const { item } = params

  switch (item.id) {
    case ActionTypes.CopyLink:
      copyProjectLink(projectId.value)
      break
    case ActionTypes.Move:
      showMoveDialog.value = true
      break
  }
}
</script>
