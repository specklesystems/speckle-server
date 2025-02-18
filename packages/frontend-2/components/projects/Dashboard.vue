<template>
  <div>
    <Portal to="primary-actions"></Portal>
    <ProjectsDashboardHeader
      :projects-invites="projectsPanelResult?.activeUser"
      :workspaces-invites="workspacesResult?.activeUser"
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
          />
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

    <ProjectsHiddenProjectWarning
      v-if="projectsPanelResult?.activeUser && projects?.numberOfHidden"
      :hidden-item-count="projectsPanelResult.activeUser.projects.numberOfHidden"
      :user="projectsPanelResult.activeUser"
    />

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
import { useQuery, useQueryLoading } from '@vue/apollo-composable'
import {
  projectsDashboardQuery,
  projectsDashboardWorkspaceQuery
} from '~~/lib/projects/graphql/queries'
import { graphql } from '~~/lib/common/generated/gql'
import type { Nullable, Optional, StreamRoles } from '@speckle/shared'
import { useDebouncedTextInput, type InfiniteLoaderState } from '@speckle/ui-components'
import { MagnifyingGlassIcon, Squares2X2Icon } from '@heroicons/vue/24/outline'
import { useUserProjectsUpdatedTracking } from '~~/lib/user/composables/projectUpdates'

graphql(`
  fragment ProjectsDashboard_UserProjectCollection on UserProjectCollection {
    numberOfHidden
  }
`)

const logger = useLogger()

const infiniteLoaderId = ref('')
const cursor = ref(null as Nullable<string>)
const selectedRoles = ref(undefined as Optional<StreamRoles[]>)
const openNewProject = ref(false)
const showLoadingBar = ref(false)
const areQueriesLoading = useQueryLoading()
const isWorkspacesEnabled = useIsWorkspacesEnabled()
const { isGuest } = useActiveUser()
useUserProjectsUpdatedTracking()

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
  },
  cursor: null as Nullable<string>
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
