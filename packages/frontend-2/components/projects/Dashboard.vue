<template>
  <div>
    <Portal to="primary-actions"></Portal>
    <ProjectsDashboardHeader
      :projects-invites="projectsPanelResult?.activeUser || undefined"
      :workspaces-invites="workspacesResult?.activeUser || undefined"
    />

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
            allow-unset
            fixed-height
            clearable
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
      :is-guest="isGuest"
      @create-project="openNewProject = true"
    />
    <template v-else-if="projects?.items?.length">
      <ProjectsDashboardFilled :projects="projects" show-workspace-link />
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
import {
  projectsDashboardQuery,
  projectsDashboardWorkspaceQuery
} from '~~/lib/projects/graphql/queries'
import { graphql } from '~~/lib/common/generated/gql'
import { getCacheId, modifyObjectField } from '~~/lib/common/helpers/graphql'
import { UserProjectsUpdatedMessageType } from '~~/lib/common/generated/gql/graphql'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { projectRoute } from '~~/lib/common/helpers/route'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import type { Nullable, Optional, StreamRoles } from '@speckle/shared'
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
const isWorkspacesEnabled = useIsWorkspacesEnabled()

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

const { result: workspacesResult } = useQuery(
  projectsDashboardWorkspaceQuery,
  undefined,
  () => ({
    enabled: isWorkspacesEnabled.value
  })
)

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
    modifyObjectField(
      cache,
      getCacheId('User', activeUserId),
      'projects',
      ({ helpers: { ref, createUpdatedValue } }) =>
        createUpdatedValue(({ update }) => {
          update('items', (items) => [
            ref('Project', incomingProject.id),
            ...(items || [])
          ])
          update('totalCount', (count) => count + 1)
        }),
      { autoEvictFiltered: true }
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
</script>
