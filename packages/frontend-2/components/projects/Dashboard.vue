<template>
  <div>
    <Portal to="primary-actions">
      <FormButton :icon-left="PlusIcon" @click="openNewProject = true">
        New Project
      </FormButton>
    </Portal>
    <ProjectsInviteBanners
      v-if="projectsPanelResult?.activeUser?.projectInvites?.length"
      class="mb-4"
      :invites="projectsPanelResult?.activeUser"
    />
    <div class="flex items-center mb-8 top-16">
      <h1 class="h4 font-bold flex-grow">Projects</h1>
      <div class="w-96">
        <FormTextInput
          v-if="!showEmptyState"
          v-model="search"
          name="modelsearch"
          :show-label="false"
          placeholder="Search"
          class="bg-foundation shadow"
          :show-clear="!!search"
          @change="updateSearchImmediately"
          @update:model-value="updateDebouncedSearch"
        ></FormTextInput>
      </div>
    </div>
    <CommonLoadingBar :loading="showLoadingBar" class="my-2" />
    <ProjectsDashboardEmptyState v-if="showEmptyState" />
    <template v-else-if="projects?.items?.length">
      <ProjectsDashboardFilled :projects="projects" />
      <InfiniteLoading @infinite="infiniteLoad" />
    </template>
    <CommonEmptySearchState
      v-else-if="!showLoadingBar"
      @clear-search=";(search = ''), updateSearchImmediately()"
    />
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
import { PlusIcon } from '@heroicons/vue/24/solid'
import { debounce } from 'lodash-es'
import { graphql } from '~~/lib/common/generated/gql'
import {
  updateCacheByFilter,
  getCacheId,
  evictObjectFields
} from '~~/lib/common/helpers/graphql'
import {
  ProjectsDashboardQueryQueryVariables,
  UserProjectsUpdatedMessageType
} from '~~/lib/common/generated/gql/graphql'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { projectRoute } from '~~/lib/common/helpers/route'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { InfiniteLoaderState } from '~~/lib/global/helpers/components'
import { Nullable } from '@speckle/shared'

const onUserProjectsUpdateSubscription = graphql(`
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

const cursor = ref(null as Nullable<string>)
const search = ref('')
const debouncedSearch = ref('')
const openNewProject = ref(false)
const showLoadingBar = ref(false)

const { activeUser } = useActiveUser()
const { triggerNotification } = useGlobalToast()
const route = useRoute()
const areQueriesLoading = useQueryLoading()
const apollo = useApolloClient().client
const {
  result: projectsPanelResult,
  fetchMore: fetchMoreProjects,
  onResult: onProjectsResult
} = useQuery(projectsDashboardQuery, () => {
  return {
    filter: {
      search: (debouncedSearch.value || '').trim() || null
    }
  }
})

onProjectsResult((res) => {
  cursor.value = res.data.activeUser?.projects.cursor || null
})

const { onResult: onUserProjectsUpdate } = useSubscription(
  onUserProjectsUpdateSubscription
)

const forceEmptyState = computed(() => !!route.query.forceEmpty)
const projects = computed(() => projectsPanelResult.value?.activeUser?.projects)
const showEmptyState = computed(
  () => forceEmptyState.value || (projects.value && !projects.value.totalCount)
)

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
  if (!res.data?.userProjectsUpdated) return

  const activeUserId = activeUser.value?.id
  const event = res.data.userProjectsUpdated
  const isNewProject = event.type === UserProjectsUpdatedMessageType.Added
  const incomingProject = event.project
  const cache = apollo.cache

  // Update main projects query (no search)
  const variables: ProjectsDashboardQueryQueryVariables = {
    filter: { search: null }
  }
  updateCacheByFilter(
    cache,
    {
      query: {
        query: projectsDashboardQuery,
        variables
      }
    },
    (data) => {
      const projects = data.activeUser?.projects
      if (!projects?.items) return

      const newItems = [...projects.items]
      let newTotalCount = projects.totalCount

      if (isNewProject && incomingProject) {
        newItems.unshift(incomingProject)
        newTotalCount += 1
      } else {
        const idx = newItems.findIndex((i) => i.id === event.id)
        if (idx !== -1) {
          newItems.splice(idx, 1)
        }
        newTotalCount -= 1
      }

      return {
        ...data,
        activeUser: data.activeUser
          ? {
              ...data.activeUser,
              projects: {
                ...data.activeUser.projects,
                items: newItems,
                totalCount: newTotalCount
              }
            }
          : null
      }
    }
  )

  // Update searches
  if (!isNewProject) {
    // Evict old project from cache entirely to remove it from all searches
    cache.evict({
      id: getCacheId('Project', event.id)
    })
  } else if (activeUserId) {
    // Evict all User.projects searches, leave default query w/o any search string
    evictObjectFields<ProjectsDashboardQueryQueryVariables>(
      cache,
      getCacheId('User', activeUserId),
      (field, variables) => {
        if (field !== 'projects') return false
        return !!variables.filter?.search
      }
    )
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
    console.error(e)
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
</script>
