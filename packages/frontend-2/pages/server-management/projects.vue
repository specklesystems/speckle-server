<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink to="/server-management" name="Server Management"></HeaderNavLink>
      <HeaderNavLink to="/server-management/projects" name="Projects"></HeaderNavLink>
    </Portal>

    <div class="flex justify-between items-center mb-8">
      <h1 class="h4 font-bold">Projects</h1>
      <FormButton :icon-left="PlusIcon" @click="openNewProject = true">New</FormButton>
    </div>

    <FormTextInput
      size="lg"
      name="search"
      :custom-icon="MagnifyingGlassIcon"
      color="foundation"
      full-width
      search
      :show-clear="!!searchString"
      placeholder="Search Projects"
      class="rounded-md border border-outline-3"
      @update:model-value="debounceSearchUpdate"
      @change="($event) => searchUpdateHandler($event.value)"
    />

    <LayoutTable
      class="mt-8"
      :columns="[
        { id: 'name', header: 'Name', classes: 'col-span-3 truncate' },
        { id: 'type', header: 'Type', classes: 'col-span-1' },
        { id: 'created', header: 'Created', classes: 'col-span-2' },
        { id: 'modified', header: 'Modified', classes: 'col-span-2' },
        { id: 'models', header: 'Models', classes: 'col-span-1 text-right' },
        { id: 'versions', header: 'Versions', classes: 'col-span-1 text-right' },
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
        <span class="capitalize">
          {{ isProject(item) ? item.visibility.toLowerCase() : '' }}
        </span>
      </template>

      <template #created="{ item }">
        {{ isProject(item) ? new Date(item.createdAt).toLocaleString('en-GB') : '' }}
      </template>

      <template #modified="{ item }">
        {{ isProject(item) ? new Date(item.updatedAt).toLocaleString('en-GB') : '' }}
      </template>

      <template #models="{ item }">
        {{ isProject(item) ? item.models.totalCount : '' }}
      </template>

      <template #versions="{ item }">
        {{ isProject(item) ? item.versions.totalCount : '' }}
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
import { MagnifyingGlassIcon, TrashIcon, PlusIcon } from '@heroicons/vue/24/outline'
import { getProjectsQuery } from '~~/lib/server-management/graphql/queries'
import type { ItemType, ProjectItem } from '~~/lib/server-management/helpers/types'
import type { InfiniteLoaderState } from '~~/lib/global/helpers/components'
import { isProject } from '~~/lib/server-management/helpers/utils'

const logger = useLogger()
const router = useRouter()

useHead({
  title: 'Projects'
})

definePageMeta({
  middleware: ['admin']
})

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
