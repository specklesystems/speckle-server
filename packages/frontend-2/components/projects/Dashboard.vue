<template>
  <div>
    <Portal to="primary-actions">
      <FormButton :icon-left="PlusIcon">New Project</FormButton>
    </Portal>
    <div class="flex items-center mb-8 top-16">
      <h1 class="h4 font-bold flex-grow">Projects</h1>
      <div class="w-96">
        <FormTextInput
          v-model="search"
          name="modelsearch"
          :show-label="false"
          placeholder="Search"
          class="bg-foundation shadow"
          show-clear
          @change="updateSearchImmediately"
          @update:model-value="updateDebouncedSearch"
        ></FormTextInput>
      </div>
    </div>
    <template v-if="areQueriesLoading">TODO: Stuff is loading, please wait</template>
    <template v-else>
      <ProjectsDashboardEmptyState
        v-if="!searchKey && (forceEmptyState || (projects && !projects.totalCount))"
      />
      <ProjectsDashboardFilled
        v-else-if="projects?.items?.length"
        :projects="projects"
      />
      <div v-else>TODO: Project search empty state</div>
    </template>
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
import { updateCacheByFilter, getCacheId } from '~~/lib/common/helpers/graphql'
import {
  ProjectsDashboardQueryQueryVariables,
  UserProjectsUpdatedMessageType
} from '~~/lib/common/generated/gql/graphql'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { projectRoute } from '~~/lib/common/helpers/route'

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

const search = ref('')
const debouncedSearch = ref('')

const { triggerNotification } = useGlobalToast()
const route = useRoute()
const areQueriesLoading = useQueryLoading()
const apollo = useApolloClient().client
const { result: projectsPanelResult, variables: searchVariables } = useQuery(
  projectsDashboardQuery,
  () => {
    return {
      filter: {
        search: (debouncedSearch.value || '').trim() || null
      }
    }
  }
)

const { onResult: onUserProjectsUpdate } = useSubscription(
  onUserProjectsUpdateSubscription
)

const searchKey = computed(() => searchVariables.value?.filter?.search)
const forceEmptyState = computed(() => !!route.query.forceEmpty)
const projects = computed(() => projectsPanelResult.value?.activeUser?.projects)

const updateDebouncedSearch = debounce(() => {
  debouncedSearch.value = search.value.trim()
}, 2000)

const updateSearchImmediately = () => {
  updateDebouncedSearch.cancel()
  debouncedSearch.value = search.value.trim()
}

onUserProjectsUpdate((res) => {
  if (!res.data?.userProjectsUpdated) return

  const event = res.data.userProjectsUpdated
  const isNewProject = event.type === UserProjectsUpdatedMessageType.Added
  const incomingProject = event.project
  const cache = apollo.cache

  // Update main projects query (no search)
  updateCacheByFilter(
    cache,
    {
      query: {
        query: projectsDashboardQuery,
        variables: <ProjectsDashboardQueryQueryVariables>{
          filter: { search: null }
        }
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

  // TODO: Test
  if (!isNewProject) {
    // Evict old project from cache entirely
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
</script>
