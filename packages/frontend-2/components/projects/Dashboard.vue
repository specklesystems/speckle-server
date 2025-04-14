<template>
  <div>
    <Portal to="primary-actions"></Portal>
    <div v-if="!showEmptyState" class="flex flex-col gap-4">
      <ProjectsMoveToWorkspaceAlert v-if="isWorkspacesEnabled" />
      <div class="flex items-center gap-2 mb-2">
        <Squares2X2Icon class="h-5 w-5" />
        <h1 class="text-heading-lg">Projects</h1>
      </div>

      <div class="flex flex-col lg:flex-row gap-2 lg:items-center justify-between">
        <div class="flex flex-col md:flex-row gap-2">
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
          <div v-if="!showEmptyState && isWorkspacesEnabled" class="md:mt-1">
            <FormCheckbox
              id="projects-to-move"
              v-model="filterProjectsToMove"
              label-classes="!font-normal select-none"
              name="Projects to move"
            />
          </div>
        </div>
        <FormButton
          v-if="canCreatePersonalProject?.authorized"
          class="!text-body-xs !font-normal"
          @click="openNewProject = true"
        >
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
      :can-create-project="canCreatePersonalProject?.authorized"
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
import { projectsDashboardQuery } from '~~/lib/projects/graphql/queries'
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

graphql(`
  fragment ProjectsDashboard_User on User {
    permissions {
      canCreatePersonalProject {
        ...FullPermissionCheckResult
      }
    }
  }
`)

const logger = useLogger()

const infiniteLoaderId = ref('')
const cursor = ref(null as Nullable<string>)
const selectedRoles = ref(undefined as Optional<StreamRoles[]>)
const filterProjectsToMove = ref(false)
const openNewProject = ref(false)
const showLoadingBar = ref(false)
const areQueriesLoading = useQueryLoading()
const isWorkspacesEnabled = useIsWorkspacesEnabled()
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
    onlyWithRoles: filterProjectsToMove.value
      ? ['stream:owner']
      : selectedRoles.value?.length
      ? selectedRoles.value
      : null,
    personalOnly: isWorkspacesEnabled.value
  },
  cursor: null as Nullable<string>
}))

onProjectsResult((res) => {
  cursor.value = res.data?.activeUser?.projects.cursor || null
  infiniteLoaderId.value = JSON.stringify(projectsVariables.value?.filter || {})
})

const canCreatePersonalProject = computed(
  () => projectsPanelResult.value?.activeUser?.permissions?.canCreatePersonalProject
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
