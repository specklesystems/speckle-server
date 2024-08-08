<template>
  <div>
    <div v-if="!showEmptyState" class="flex flex-col gap-4">
      <WorkspaceHeader :icon="Squares2X2Icon" :workspace-id="workspaceId" />
      <div class="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <div class="flex flex-col sm:flex-row gap-2">
          <FormTextInput
            v-model="search"
            name="modelsearch"
            :show-label="false"
            placeholder="Search..."
            :custom-icon="MagnifyingGlassIcon"
            color="foundation"
            wrapper-classes="grow md:grow-0 md:w-60"
            :show-clear="!!search"
            @change="updateSearchImmediately"
            @update:model-value="updateDebouncedSearch"
          ></FormTextInput>
          <!-- <FormSelectProjectRoles
            v-if="!showEmptyState"
            v-model="selectedRoles"
            class="md:w-56 grow md:grow-0"
            fixed-height
          /> -->
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
    <ProjectsAddDialog v-model:open="openNewProject" :workspace-id="workspaceId" />
  </div>
</template>

<script setup lang="ts">
import { MagnifyingGlassIcon, Squares2X2Icon } from '@heroicons/vue/24/outline'
import {
  useApolloClient,
  useQuery,
  useQueryLoading,
  useSubscription
} from '@vue/apollo-composable'
import { debounce } from 'lodash-es'
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
import type { InfiniteLoaderState } from '~~/lib/global/helpers/components'
import type { Nullable, Optional, StreamRoles } from '@speckle/shared'
import { workspacePageQuery } from '~~/lib/workspaces/graphql/queries'

const logger = useLogger()

const infiniteLoaderId = ref('')
const cursor = ref(null as Nullable<string>)
const selectedRoles = ref(undefined as Optional<StreamRoles[]>)
const search = ref('')
const debouncedSearch = ref('')
const openNewProject = ref(false)
const showLoadingBar = ref(false)

const { activeUser, isGuest } = useActiveUser()
const { triggerNotification } = useGlobalToast()
const areQueriesLoading = useQueryLoading()
const apollo = useApolloClient().client

const props = defineProps<{
  workspaceId: string
}>()

const {
  result: projectsPanelResult,
  fetchMore: fetchMoreProjects,
  onResult: onProjectsResult,
  variables: projectsVariables
} = useQuery(workspacePageQuery, () => ({
  workspaceId: props.workspaceId,
  filter: {
    search: (debouncedSearch.value || '').trim() || null
    // onlyWithRoles: selectedRoles.value?.length ? selectedRoles.value : null
  }
}))

onProjectsResult((res) => {
  const projectsData = res.data?.workspace?.projects
  if (projectsData) {
    cursor.value = projectsData.cursor || null
    infiniteLoaderId.value = JSON.stringify(projectsVariables.value?.filter || {})
  }
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

const projects = computed(() => projectsPanelResult.value?.workspace?.projects)

const showEmptyState = computed(() => {
  return false
})

const moreToLoad = computed(
  () =>
    (!projects.value || projects.value.items.length < projects.value.totalCount) &&
    cursor.value
)

const updateDebouncedSearch = debounce(() => {
  debouncedSearch.value = search.value.trim()
}, 1000)

const updateSearchImmediately = () => {
  updateDebouncedSearch.cancel()
  debouncedSearch.value = search.value.trim()
}

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
  updateSearchImmediately()
}
</script>
