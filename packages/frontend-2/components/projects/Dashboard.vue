<template>
  <div>
    <Portal to="primary-actions"></Portal>
    <div
      class="w-[calc(100vw-8px)] ml-[calc(50%-50vw+4px)] mr-[calc(50%-50vw+4px)] -mt-6 mb-10 bg-foundation divide-y divide-outline-3 border-b border-outline-3"
    >
      <div v-if="showChecklist">
        <OnboardingChecklistV1 show-intro />
      </div>
      <ProjectsInviteBanners
        v-if="projectsPanelResult?.activeUser?.projectInvites?.length"
        :invites="projectsPanelResult?.activeUser"
      />
      <WorkspaceInviteBanners
        v-if="projectsPanelResult?.activeUser?.workspaceInvites?.length"
        :invites="projectsPanelResult.activeUser"
      >
        <ProjectsNewSpeckleBanner
          v-if="showNewSpeckleBanner"
          @dismissed="onDismissNewSpeckleBanner"
        />
      </WorkspaceInviteBanners>
    </div>

    <PromoBannersWrapper v-if="promoBanners.length" :banners="promoBanners" />

    <div v-if="!showEmptyState" class="flex flex-col gap-4">
      <div class="flex items-center gap-2 mb-2">
        <Squares2X2Icon class="h-5 w-5" />
        <h1 class="text-heading-lg">Projects</h1>
      </div>

      <div class="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <div class="flex flex-col sm:flex-row gap-2">
          <FormTextInput
            name="modelsearch"
            :show-label="false"
            placeholder="Search..."
            :custom-icon="MagnifyingGlassIcon"
            color="foundation"
            wrapper-classes="grow md:grow-0 md:w-60"
            :show-clear="!!search"
            v-bind="bind"
            v-on="on"
          ></FormTextInput>
          <FormSelectProjectRoles
            v-if="!showEmptyState"
            v-model="selectedRoles"
            class="md:w-56 grow md:grow-0"
            fixed-height
          />
        </div>
        <FormButton v-if="!isGuest" @click="openNewProject = true">
          New project
        </FormButton>
      </div>
    </div>
    <CommonLoadingBar :loading="showLoadingBar" class="my-2" />
    <ProjectsDashboardEmptyState
      v-if="showEmptyState"
      @create-project="openNewProject = true"
    />
    <template v-else-if="projects?.items?.length">
      <ProjectsDashboardFilled :projects="projects" />
      <InfiniteLoading
        :settings="{ identifier: infiniteLoaderId }"
        @infinite="infiniteLoad"
      />
    </template>
    <CommonEmptySearchState v-else-if="!showLoadingBar" @clear-search="clearSearch" />
    <ProjectsAddDialog v-model:open="openNewProject" />
  </div>
</template>

<script setup lang="ts">
import {
  useApolloClient,
  useQuery,
  useQueryLoading,
  useSubscription
} from '@vue/apollo-composable'
import { projectsDashboardQuery } from '~~/lib/projects/graphql/queries'
import { graphql } from '~~/lib/common/generated/gql'
import {
  getCacheId,
  evictObjectFields,
  modifyObjectFields
} from '~~/lib/common/helpers/graphql'
import type { User, UserProjectsArgs } from '~~/lib/common/generated/gql/graphql'
import { UserProjectsUpdatedMessageType } from '~~/lib/common/generated/gql/graphql'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { projectRoute } from '~~/lib/common/helpers/route'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import type { Nullable, Optional, StreamRoles } from '@speckle/shared'
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'
import type { PromoBanner } from '~/lib/promo-banners/types'
import { useDebouncedTextInput, type InfiniteLoaderState } from '@speckle/ui-components'
import { MagnifyingGlassIcon, Squares2X2Icon } from '@heroicons/vue/24/outline'

const logger = useLogger()

const infiniteLoaderId = ref('')
const cursor = ref(null as Nullable<string>)
const selectedRoles = ref(undefined as Optional<StreamRoles[]>)
const openNewProject = ref(false)
const showLoadingBar = ref(false)
const { activeUser, isGuest } = useActiveUser()
const { triggerNotification } = useGlobalToast()
const areQueriesLoading = useQueryLoading()
const apollo = useApolloClient().client

const promoBanners = ref<PromoBanner[]>([
  {
    id: 'speckleverse',
    primaryText: 'Join our online hackathon!',
    secondaryText: 'June 7 - 9, 2024',
    url: 'https://beyond-the-speckleverse.devpost.com/',
    priority: 1,
    expiryDate: '2024-06-10'
  }
])

const {
  on,
  bind,
  value: search
} = useDebouncedTextInput({
  debouncedBy: 800
})

const {
  result: projectsPanelResult,
  fetchMore: fetchMoreProjects,
  onResult: onProjectsResult,
  variables: projectsVariables
} = useQuery(projectsDashboardQuery, () => ({
  filter: {
    search: (search.value || '').trim() || null,
    onlyWithRoles: selectedRoles.value?.length ? selectedRoles.value : null
  }
}))

onProjectsResult((res) => {
  cursor.value = res.data?.activeUser?.projects.cursor || null
  infiniteLoaderId.value = JSON.stringify(projectsVariables.value?.filter || {})
})

const { onResult: onUserProjectsUpdate } = useSubscription(
  graphql(`
    subscription OnUserProjectsUpdate {
      userProjectsUpdated {
        type
        id
        project {
          ...ProjectDashboardItem
        }
      }
    }
  `)
)

const projects = computed(() => projectsPanelResult.value?.activeUser?.projects)
const showEmptyState = computed(() => {
  const isFiltering =
    projectsVariables.value?.filter?.onlyWithRoles?.length ||
    projectsVariables.value?.filter?.search?.length
  if (isFiltering) return false

  return projects.value && !projects.value.items.length
})

const moreToLoad = computed(
  () =>
    (!projects.value || projects.value.items.length < projects.value.totalCount) &&
    cursor.value
)

onUserProjectsUpdate((res) => {
  const activeUserId = activeUser.value?.id
  const event = res.data?.userProjectsUpdated

  if (!event) return
  if (!activeUserId) return

  const isNewProject = event.type === UserProjectsUpdatedMessageType.Added
  const incomingProject = event.project
  const cache = apollo.cache

  if (isNewProject && incomingProject) {
    // Add to User.projects where possible
    modifyObjectFields<UserProjectsArgs, User['projects']>(
      cache,
      getCacheId('User', activeUserId),
      (fieldName, variables, value, { ref }) => {
        if (fieldName !== 'projects') return
        if (variables.filter?.search?.length) return
        if (variables.filter?.onlyWithRoles?.length) {
          const roles = variables.filter.onlyWithRoles
          if (!roles.includes(incomingProject.role || '')) return
        }

        return {
          ...value,
          items: [ref('Project', incomingProject.id), ...(value.items || [])],
          totalCount: (value.totalCount || 0) + 1
        }
      }
    )

    // Elsewhere - just evict fields directly
    evictObjectFields<UserProjectsArgs, User['projects']>(
      cache,
      getCacheId('User', activeUserId),
      (fieldName, variables) => {
        if (fieldName !== 'projects') return false
        if (variables.filter?.search?.length) return true

        return false
      }
    )
  }

  if (!isNewProject) {
    // Evict old project from cache entirely to remove it from all searches
    cache.evict({
      id: getCacheId('Project', event.id)
    })
  }

  // Emit toast notification
  triggerNotification({
    type: ToastNotificationType.Info,
    title: isNewProject ? 'New project added' : 'A project has been removed',
    cta:
      isNewProject && incomingProject
        ? {
            url: projectRoute(incomingProject.id),
            title: 'View project'
          }
        : undefined
  })
})

const infiniteLoad = async (state: InfiniteLoaderState) => {
  if (!moreToLoad.value) return state.complete()

  try {
    await fetchMoreProjects({
      variables: {
        cursor: cursor.value
      }
    })
  } catch (e) {
    logger.error(e)
    state.error()
    return
  }

  state.loaded()
  if (!moreToLoad.value) {
    state.complete()
  }
}

watch(search, (newVal) => {
  if (newVal) showLoadingBar.value = true
  else showLoadingBar.value = false
})

watch(areQueriesLoading, (newVal) => (showLoadingBar.value = newVal))

const clearSearch = () => {
  search.value = ''
  selectedRoles.value = []
}

const hasCompletedChecklistV1 = useSynchronizedCookie<boolean>(
  `hasCompletedChecklistV1`,
  {
    default: () => false
  }
)

const hasDismissedChecklistTime = useSynchronizedCookie<string | undefined>(
  `hasDismissedChecklistTime`,
  { default: () => undefined }
)

const hasDismissedChecklistForever = useSynchronizedCookie<boolean | undefined>(
  `hasDismissedChecklistForever`,
  {
    default: () => false
  }
)

const hasDismissedChecklistTimeAgo = computed(() => {
  return (
    new Date().getTime() -
    new Date(hasDismissedChecklistTime.value || Date.now()).getTime()
  )
})

const hasDismissedNewSpeckleBanner = useSynchronizedCookie<boolean | undefined>(
  `hasDismissedNewSpeckleBanner`,
  { default: () => false }
)

const showChecklist = computed(() => {
  if (hasDismissedChecklistForever.value) return false
  if (hasCompletedChecklistV1.value) return false
  if (hasDismissedChecklistTime.value === undefined) return true
  if (
    hasDismissedChecklistTime.value !== undefined &&
    hasDismissedChecklistTimeAgo.value > 86400000
  )
    return true
  return false
})

const showNewSpeckleBanner = computed(() => {
  if (hasDismissedNewSpeckleBanner.value) return false
  if (projectsPanelResult?.value?.activeUser?.projectInvites.length) return false

  return true
})

const onDismissNewSpeckleBanner = () => {
  hasDismissedNewSpeckleBanner.value = true
}
</script>
