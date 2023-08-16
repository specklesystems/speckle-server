<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink to="/server-management" name="Server Management"></HeaderNavLink>
      <HeaderNavLink to="/server-management/projects" name="Projects"></HeaderNavLink>
    </Portal>

    <h1 class="h4 font-bold mb-4">Projects</h1>

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
      @change="handleSearchChange"
    />

    <Table
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
        name: 'col-span-3',
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
        {{ item.name }}
      </template>

      <template #type="{ item }">
        <div class="lowercase">
          {{ item.visibility }}
        </div>
      </template>

      <template #created="{ item }">
        <div class="font-mono text-xs">
          {{ new Date(item.createdAt).toLocaleString('en-GB') }}
        </div>
      </template>

      <template #modified="{ item }">
        <div class="font-mono text-xs">
          {{ new Date(item.updatedAt).toLocaleString('en-GB') }}
        </div>
      </template>

      <template #models="{ item }">
        <div class="font-mono text-xs">
          {{ item.models.totalCount }}
        </div>
      </template>

      <template #versions="{ item }">
        <div class="font-mono text-xs">
          {{ item.versions.totalCount }}
        </div>
      </template>

      <template #contributors="{ item }">
        <Avatar
          v-for="(teamMember, index) in item.team"
          :key="index"
          :size="small"
          :user="item.user"
          class="-mr-2"
        />
      </template>
    </Table>

    <InfiniteLoading
      :settings="{ identifier: infiniteLoaderId }"
      class="py-4"
      @infinite="infiniteLoad"
    />

    <ProjectDeleteDialog
      v-model:open="showProjectDeleteDialog"
      :project="projectToModify"
      title="Delete Project"
      :buttons="[
        {
          text: 'Delete',
          props: { color: 'danger', fullWidth: true },
          onClick: deleteConfirmed
        },
        {
          text: 'Cancel',
          props: { color: 'secondary', fullWidth: true, outline: true },
          onClick: closeProjectDeleteDialog
        }
      ]"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { debounce } from 'lodash-es'
import Table from '~~/components/server-management/Table.vue'
import ProjectDeleteDialog from '~~/components/server-management/DeleteProjectDialog.vue'
import Avatar from '~~/components/user/Avatar.vue'
import { Project } from '~~/lib/common/generated/gql/graphql'
import { InfiniteLoaderState } from '~~/lib/global/helpers/components'
import { graphql } from '~~/lib/common/generated/gql'
import { MagnifyingGlassIcon, TrashIcon } from '@heroicons/vue/20/solid'

const getProjects = graphql(`
  query AdminPanelProjectsList(
    $query: String
    $orderBy: String
    $limit: Int!
    $visibility: String
  ) {
    admin {
      projectList(
        query: $query
        orderBy: $orderBy
        limit: $limit
        visibility: $visibility
      ) {
        cursor
        items {
          id
          name
          visibility
          createdAt
          updatedAt
          models {
            totalCount
          }
          versions {
            totalCount
          }
          team {
            user {
              avatar
              id
            }
          }
        }
        totalCount
      }
    }
  }
`)

const logger = useLogger()
const router = useRouter()

definePageMeta({
  middleware: ['admin']
})

const projectToModify = ref<Project | null>(null)
const searchString = ref('')
const showProjectDeleteDialog = ref(false)
const infiniteLoaderId = ref('')

const moreToLoad = computed(
  () =>
    !extraPagesResult.value?.admin?.projectList ||
    extraPagesResult.value.admin.projectList.items.length <
      extraPagesResult.value.admin.projectList.totalCount
)

const projects = computed(() => extraPagesResult.value?.admin.projectList.items || [])

const openProjectDeleteDialog = (project: Project) => {
  projectToModify.value = project
  showProjectDeleteDialog.value = true
}

const closeProjectDeleteDialog = () => {
  showProjectDeleteDialog.value = false
}

const handleSearchChange = (newSearchString: string) => {
  searchUpdateHandler(newSearchString)
}

const handleProjectClick = (project: Project) => {
  router.push(`/projects/${project.id}`)
}

const {
  result: extraPagesResult,
  fetchMore: fetchMorePages,
  variables: resultVariables,
  onResult
} = useQuery(getProjects, () => ({
  limit: 50,
  query: searchString.value
}))

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
