<template>
  <div>
    <div v-if="!showEmptyState" class="flex flex-col gap-4">
      <WorkspaceHeader
        v-if="workspace"
        :icon="Squares2X2Icon"
        :workspace-info="workspace"
        :project-count="projects?.totalCount"
      />
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
            :model-value="bind.modelValue.value"
            v-on="on"
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
import { useQuery, useQueryLoading } from '@vue/apollo-composable'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import type { InfiniteLoaderState } from '~~/lib/global/helpers/components'
import type { Nullable, Optional, StreamRoles } from '@speckle/shared'
import { workspacePageQuery } from '~~/lib/workspaces/graphql/queries'
import { useDebouncedTextInput } from '@speckle/ui-components'

const logger = useLogger()

const infiniteLoaderId = ref('')
const cursor = ref(null as Nullable<string>)
const selectedRoles = ref(undefined as Optional<StreamRoles[]>)
const openNewProject = ref(false)
const showLoadingBar = ref(false)

const { isGuest } = useActiveUser()
const areQueriesLoading = useQueryLoading()

const props = defineProps<{
  workspaceId: string
}>()

const {
  on,
  bind,
  value: search
} = useDebouncedTextInput({
  debouncedBy: 800,
  model: ref('')
})

const {
  result: projectsPanelResult,
  fetchMore: fetchMoreProjects,
  onResult: onProjectsResult,
  variables: projectsVariables
} = useQuery(workspacePageQuery, () => ({
  workspaceId: props.workspaceId,
  filter: {
    search: (search.value || '').trim() || null
  }
}))

onProjectsResult((res) => {
  const projectsData = res.data?.workspace?.projects
  if (projectsData) {
    cursor.value = projectsData.cursor || null
    infiniteLoaderId.value = JSON.stringify(projectsVariables.value?.filter || {})
  }
})

const workspace = computed(() => projectsPanelResult.value?.workspace)
const projects = computed(() => projectsPanelResult.value?.workspace?.projects)

const showEmptyState = computed(() => {
  return !projects.value?.items?.length
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
  showLoadingBar.value = !!newVal
})

watch(areQueriesLoading, (newVal) => (showLoadingBar.value = newVal))

const clearSearch = () => {
  search.value = ''
  selectedRoles.value = []
}
</script>
