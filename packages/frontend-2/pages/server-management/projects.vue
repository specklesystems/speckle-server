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

    <ServerManagementTable
      class="mt-8"
      :headers="[
        { id: 'name', title: 'Name' },
        { id: 'type', title: 'Type' },
        { id: 'created', title: 'Created' },
        { id: 'modified', title: 'Modified' },
        { id: 'models', title: 'Models' },
        { id: 'versions', title: 'Versions' },
        { id: 'contributors', title: 'Contributors' }
      ]"
      :items="projects"
      :buttons="[{ icon: TrashIcon, label: 'Delete', action: openProjectDeleteDialog }]"
      :column-classes="{
        name: 'col-span-3 truncate',
        type: 'col-span-1',
        created: 'col-span-2',
        modified: 'col-span-2',
        models: 'col-span-1 text-right',
        versions: 'col-span-1 text-right',
        contributors: 'col-span-2'
      }"
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
        <div class="font-mono text-xs">
          {{ isProject(item) ? new Date(item.createdAt).toLocaleString('en-GB') : '' }}
        </div>
      </template>

      <template #modified="{ item }">
        <div class="font-mono text-xs">
          {{ isProject(item) ? new Date(item.updatedAt).toLocaleString('en-GB') : '' }}
        </div>
      </template>

      <template #models="{ item }">
        <div class="font-mono text-xs">
          {{ isProject(item) ? item.models.totalCount : '' }}
        </div>
      </template>

      <template #versions="{ item }">
        <div class="font-mono text-xs">
          {{ isProject(item) ? item.versions.totalCount : '' }}
        </div>
      </template>

      <template #contributors="{ item }">
        <div v-if="isProject(item)" class="py-1">
          <UserAvatarGroup :users="item.team.map((t) => t.user)" :max-count="3" />
        </div>
      </template>
    </ServerManagementTable>

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
import { MagnifyingGlassIcon, TrashIcon, PlusIcon } from '@heroicons/vue/20/solid'
import { getProjectsQuery } from '~~/lib/server-management/graphql/queries'
import { ItemType, ProjectItem } from '~~/lib/server-management/helpers/types'
import { InfiniteLoaderState } from '~~/lib/global/helpers/components'
import { isProject } from '~~/lib/server-management/helpers/utils'

const logger = useLogger()
const router = useRouter()

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
