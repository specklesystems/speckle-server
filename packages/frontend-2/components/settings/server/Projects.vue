<template>
  <section>
    <div class="md:max-w-5xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader
        title="Projects"
        text="Manage projects across the server"
      />
      <div class="flex flex-col-reverse md:justify-between md:flex-row md:gap-x-4">
        <div class="relative w-full md:max-w-md mt-6 md:mt-0">
          <FormTextInput
            name="search"
            :custom-icon="MagnifyingGlassIcon"
            color="foundation"
            full-width
            search
            :show-clear="!!search"
            placeholder="Search projects"
            class="rounded-md border border-outline-3 md:max-w-md mt-6 md:mt-0"
            :model-value="bind.modelValue.value"
            v-on="on"
          />
        </div>
        <FormButton :icon-left="PlusIcon" @click="openNewProject = true">
          New
        </FormButton>
      </div>

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
        :buttons="[
          { icon: TrashIcon, label: 'Delete', action: openProjectDeleteDialog }
        ]"
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
            {{ formattedFullDate(item.createdAt) }}
          </div>
        </template>

        <template #modified="{ item }">
          <div class="text-xs">
            {{ formattedFullDate(item.updatedAt) }}
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

      <SettingsServerProjectDeleteDialog
        v-model:open="showProjectDeleteDialog"
        :project="projectToModify"
        title="Delete project"
        :result-variables="resultVariables"
      />

      <ProjectsAddDialog v-model:open="openNewProject" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { MagnifyingGlassIcon, TrashIcon, PlusIcon } from '@heroicons/vue/24/outline'
import { getProjectsQuery } from '~~/lib/server-management/graphql/queries'
import type { ItemType, ProjectItem } from '~~/lib/server-management/helpers/types'
import type { InfiniteLoaderState } from '~~/lib/global/helpers/components'
import { isProject } from '~~/lib/server-management/helpers/utils'
import { useDebouncedTextInput } from '@speckle/ui-components'

const search = defineModel<string>('search')

const { on, bind } = useDebouncedTextInput({ model: search })
const logger = useLogger()
const router = useRouter()

const projectToModify = ref<ProjectItem | null>(null)
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
  query: search.value
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

const calculateLoaderId = () => {
  infiniteLoaderId.value = resultVariables.value?.query || ''
}

onResult(calculateLoaderId)
</script>
