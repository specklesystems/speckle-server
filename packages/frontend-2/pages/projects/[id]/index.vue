<template>
  <div>
    <div v-if="project">
      <div v-if="invite" class="mb-4">
        <ProjectsInviteBanner
          :invite="invite"
          :show-project-name="false"
          @processed="onInviteAccepted"
        />
      </div>
      <ProjectsMoveToWorkspaceAlert
        v-if="shouldShowWorkspaceAlert"
        :disable-button="disableLegacyMoveProjectButton"
        :project-id="project.id"
        @move-project="onMoveProject"
      />

      <div
        class="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-6"
      >
        <ProjectPageHeader :project="project" />
        <div class="flex gap-x-3 items-center justify-between">
          <div class="flex flex-row gap-x-3">
            <CommonBadge v-if="project.role" rounded color="secondary">
              {{ RoleInfo.Stream[project.role as StreamRoles].title }}
            </CommonBadge>
          </div>
          <div class="flex flex-row gap-x-3">
            <div v-tippy="collaboratorsTooltip">
              <NuxtLink
                :to="
                  canReadSettings?.authorized
                    ? projectRoute(project.id, 'collaborators')
                    : ''
                "
              >
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
              :icon-right="Ellipsis"
              @click="showActionsMenu = !showActionsMenu"
            />
          </LayoutMenu>
        </div>
      </div>
      <LayoutTabsHorizontal v-model:active-item="activePageTab" :items="pageTabItems">
        <NuxtPage :project="project" />
      </LayoutTabsHorizontal>
    </div>

    <WorkspaceMoveProject
      v-if="project && isWorkspacesEnabled"
      v-model:open="showMoveDialog"
      event-source="project-page"
      :project="project"
    />
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { Roles, type Optional, RoleInfo, type StreamRoles } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import { projectPageQuery } from '~~/lib/projects/graphql/queries'
import { useGeneralProjectPageUpdateTracking } from '~~/lib/projects/composables/projectPages'
import { LayoutTabsHorizontal, type LayoutPageTabItem } from '@speckle/ui-components'
import { projectRoute, projectWebhooksRoute } from '~/lib/common/helpers/route'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import { Ellipsis } from 'lucide-vue-next'
import { HorizontalDirection } from '~~/lib/common/composables/window'
import { useCopyProjectLink } from '~~/lib/projects/composables/projectManagement'
import { useMixpanel } from '~/lib/core/composables/mp'

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
    permissions {
      canReadSettings {
        ...FullPermissionCheckResult
      }
      canReadAccIntegrationSettings {
        ...FullPermissionCheckResult
      }
      canUpdate {
        ...FullPermissionCheckResult
      }
      canMoveToWorkspace {
        ...FullPermissionCheckResult
      }
    }
    ...ProjectPageTeamInternals_Project
    ...ProjectPageProjectHeader
    ...ProjectPageTeamDialog
    ...WorkspaceMoveProjectManager_ProjectBase
    ...ProjectPageSettingsTab_Project
    ...WorkspaceMoveProject_Project
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
const { isLoggedIn } = useActiveUser()
const mixpanel = useMixpanel()

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

const canReadSettings = computed(() => project.value?.permissions.canReadSettings)
const canReadAccIntegrationSettings = computed(
  () => project.value?.permissions.canReadAccIntegrationSettings
)
const canUpdate = computed(() => project.value?.permissions.canUpdate)
const hasRole = computed(() => project.value?.role)
const teamUsers = computed(() => project.value?.team.map((t) => t.user) || [])
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
  title: projectName,
  meta: [
    {
      name: 'robots',
      content: 'noindex, nofollow'
    }
  ]
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
const isAccEnabled = useIsAccModuleEnabled()

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

  if (
    isAutomateEnabled.value &&
    project.value?.workspace &&
    project.value?.workspace?.role !== Roles.Workspace.Guest
  ) {
    items.push({
      title: 'Automations',
      id: 'automations'
    })
  }

  if (isAccEnabled.value && canReadAccIntegrationSettings.value?.authorized) {
    items.push({
      title: 'ACC',
      id: 'acc'
    })
  }

  if (canReadSettings.value?.authorized) {
    items.push({
      title: 'Collaborators',
      id: 'collaborators'
    })

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
  canReadSettings.value?.authorized
    ? canUpdate.value?.authorized
      ? 'Manage collaborators'
      : 'View collaborators'
    : null
)

const activePageTab = computed({
  get: () => {
    const path = router.currentRoute.value.path
    if (/\/discussions\/?$/i.test(path)) return findTabById('discussions')
    if (/\/automations\/?.*$/i.test(path)) return findTabById('automations')
    if (/\/acc\/?.*$/i.test(path)) return findTabById('acc')
    if (/\/collaborators\/?/i.test(path) && canReadSettings.value?.authorized)
      return findTabById('collaborators')
    if (/\/settings\/?/i.test(path) && canReadSettings.value?.authorized)
      return findTabById('settings')
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
      case 'acc':
        router.push({ path: projectRoute(projectId.value, 'acc') })
        break
      case 'automations':
        router.push({ path: projectRoute(projectId.value, 'automations') })
        break
      case 'collaborators':
        if (canReadSettings.value?.authorized) {
          router.push({ path: projectRoute(projectId.value, 'collaborators') })
        }
        break
      case 'settings':
        if (canReadSettings.value?.authorized) {
          router.push({ path: projectRoute(projectId.value, 'settings') })
        }
        break
    }
  }
})

const shouldShowWorkspaceAlert = computed(
  () =>
    isWorkspacesEnabled.value &&
    isLoggedIn.value &&
    !project.value?.workspace &&
    hasRole.value
)

const disableLegacyMoveProjectButton = computed(
  () => !project.value?.permissions.canMoveToWorkspace.authorized
)

const onMoveProject = () => {
  mixpanel.track('Move Project CTA Clicked', {
    location: 'project'
  })
  showMoveDialog.value = true
}

const onActionChosen = (params: { item: LayoutMenuItem; event: MouseEvent }) => {
  const { item } = params

  switch (item.id) {
    case ActionTypes.CopyLink:
      copyProjectLink(projectId.value)
      break
    case ActionTypes.Move:
      onMoveProject()
      break
  }
}
</script>
