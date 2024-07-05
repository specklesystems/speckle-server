<template>
  <div class="md:max-w-5xl md:mx-auto">
    <h2 class="text-2xl font-semibold font-semibold hidden md:block">Projects</h2>
    <p class="text-sm pt-6 md:pt-4">Manage projects across the server</p>

    <hr class="my-6 md:my-10" />

    <FormTextInput
      name="search"
      :custom-icon="MagnifyingGlassIcon"
      color="foundation"
      full-width
      search
      :show-clear="!!searchString"
      placeholder="Search Projects"
      class="rounded-md border border-outline-3 md:max-w-md"
      @update:model-value="debounceSearchUpdate"
      @change="($event) => searchUpdateHandler($event.value)"
    />

    <LayoutTable
      class="mt-6 md:mt-8"
      :columns="[
        { id: 'name', header: 'Name', classes: 'col-span-3 truncate' },
        { id: 'type', header: 'Type', classes: 'col-span-1' },
        { id: 'created', header: 'Created', classes: 'col-span-2' },
        { id: 'modified', header: 'Modified', classes: 'col-span-2' },
        { id: 'models', header: 'Models', classes: 'col-span-1' },
        { id: 'versions', header: 'Versions', classes: 'col-span-1' },
        { id: 'contributors', header: 'Contributors', classes: 'col-span-2' }
      ]"
      :items="projects"
      :buttons="[{ icon: TrashIcon, label: 'Delete', action: openProjectDeleteDialog }]"
      :on-row-click="handleProjectClick"
    >
      <template #name="{ item }">
        {{ isProject(item) ? item.name : '' }}
      </template>

      <template #type="{ item }">
        <div class="capitalize">
          {{ isProject(item) ? item.visibility.toLowerCase() : '' }}
        </div>
      </template>

      <template #created="{ item }">
        <div class="text-xs">
          {{ isProject(item) ? new Date(item.createdAt).toLocaleString('en-GB') : '' }}
        </div>
      </template>

      <template #modified="{ item }">
        <div class="text-xs">
          {{ isProject(item) ? new Date(item.updatedAt).toLocaleString('en-GB') : '' }}
        </div>
      </template>

      <template #models="{ item }">
        <div class="text-xs">
          {{ isProject(item) ? item.models.totalCount : '' }}
        </div>
      </template>

      <template #versions="{ item }">
        <div class="text-xs">
          {{ isProject(item) ? item.versions.totalCount : '' }}
        </div>
      </template>

      <template #contributors="{ item }">
        <div v-if="isProject(item)" class="py-1">
          <UserAvatarGroup :users="item.team.map((t) => t.user)" :max-count="3" />
        </div>
      </template>
    </LayoutTable>

    <CommonLoadingBar v-if="loading && !projects?.length" loading />

    <InfiniteLoading
      v-if="projects?.length"
      :settings="{ identifier: infiniteLoaderId }"
      class="py-4"
      @infinite="infiniteLoad"
    />

    <ServerManagementDeleteProjectDialog
      v-model:open="showProjectDeleteDialog"
      :project="projectToModify"
      title="Delete Project"
      :result-variables="resultVariables"
    />

    <ProjectsAddDialog v-model:open="openNewProject" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { debounce } from 'lodash-es'
import { useQuery } from '@vue/apollo-composable'
import { MagnifyingGlassIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { getProjectsQuery } from '~~/lib/server-management/graphql/queries'
import type { ItemType, ProjectItem } from '~~/lib/server-management/helpers/types'
import type { InfiniteLoaderState } from '~~/lib/global/helpers/components'
import { isProject } from '~~/lib/server-management/helpers/utils'

const logger = useLogger()
const router = useRouter()

const projectToModify = ref<ProjectItem | null>(null)
const searchString = ref('')
const showProjectDeleteDialog = ref(false)
const infiniteLoaderId = ref('')
const openNewProject = ref(false)

const {
  result: extraPagesResult,
  fetchMore: fetchMorePages,
  variables: resultVariables,
  onResult,
  loading
} = useQuery(getProjectsQuery, () => ({
  limit: 50,
  query: searchString.value
}))

const moreToLoad = computed(
  () =>
    !extraPagesResult.value?.admin?.projectList ||
    extraPagesResult.value.admin.projectList.items.length <
      extraPagesResult.value.admin.projectList.totalCount
)

const projects = computed(() => extraPagesResult.value?.admin.projectList.items || [])

const openProjectDeleteDialog = (item: ItemType) => {
  if (isProject(item)) {
    projectToModify.value = item
    showProjectDeleteDialog.value = true
  }
}

const handleProjectClick = (item: ItemType) => {
  router.push(`/projects/${item.id}`)
}

const infiniteLoad = async (state: InfiniteLoaderState) => {
  const cursor = extraPagesResult.value?.admin?.projectList.cursor || null
  if (!moreToLoad.value || !cursor) return state.complete()

  try {
    await fetchMorePages({
      variables: {
        cursor
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

const searchUpdateHandler = (value: string) => {
  searchString.value = value
}

const debounceSearchUpdate = debounce(searchUpdateHandler, 500)

const calculateLoaderId = () => {
  infiniteLoaderId.value = resultVariables.value?.query || ''
}

onResult(calculateLoaderId)
</script>
