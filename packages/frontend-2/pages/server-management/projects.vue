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

    <InfiniteLoading
      :settings="{ identifier: infiniteLoaderId }"
      class="py-4"
      @infinite="infiniteLoad"
    />

    <ServerManagementDeleteProjectDialog
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
import { debounce } from 'lodash-es'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { MagnifyingGlassIcon, TrashIcon } from '@heroicons/vue/20/solid'
import { ItemType, ProjectItem } from '~~/lib/server-management/helpers/types'
import { InfiniteLoaderState } from '~~/lib/global/helpers/components'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage,
  updateCacheByFilter
} from '~~/lib/common/helpers/graphql'
import { graphql } from '~~/lib/common/generated/gql'
import { isProject } from '~~/lib/server-management/helpers/utils'

const getProjects = graphql(`
  query AdminPanelProjectsList(
    $query: String
    $orderBy: String
    $limit: Int!
    $visibility: String
    $cursor: String
  ) {
    admin {
      projectList(
        query: $query
        orderBy: $orderBy
        limit: $limit
        visibility: $visibility
        cursor: $cursor
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
              name
              id
              avatar
            }
          }
        }
        totalCount
        cursor
      }
    }
  }
`)

const adminDeleteProject = graphql(`
  mutation AdminPanelDeleteProject($ids: [String!]) {
    streamsDelete(ids: $ids)
  }
`)

const logger = useLogger()
const router = useRouter()

definePageMeta({
  middleware: ['admin']
})

const projectToModify = ref<ProjectItem | null>(null)
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
const { triggerNotification } = useGlobalToast()

const { mutate: adminDeleteMutation } = useMutation(adminDeleteProject)

const openProjectDeleteDialog = (item: ItemType) => {
  if (isProject(item)) {
    projectToModify.value = item
    showProjectDeleteDialog.value = true
  }
}

const closeProjectDeleteDialog = () => {
  showProjectDeleteDialog.value = false
}

const handleSearchChange = (newSearchString: string) => {
  searchUpdateHandler(newSearchString)
}

const handleProjectClick = (item: ItemType) => {
  router.push(`/projects/${item.id}`)
}

const deleteConfirmed = async () => {
  const projectId = projectToModify.value?.id
  if (!projectId) {
    return
  }

  const result = await adminDeleteMutation(
    {
      ids: [projectId]
    },
    {
      update: (cache, { data }) => {
        if (data?.streamsDelete) {
          // Remove item from cache
          cache.evict({
            id: getCacheId('AdminUserListItem', projectId)
          })

          // Update list
          updateCacheByFilter(
            cache,
            { query: { query: getProjects, variables: resultVariables.value } },
            (data) => {
              const newItems = data.admin.projectList.items.filter(
                (item) => item.id !== projectId
              )
              return {
                ...data,
                admin: {
                  ...data.admin,
                  projectList: {
                    ...data.admin.projectList,
                    items: newItems,
                    totalCount: Math.max(0, data.admin.projectList.totalCount - 1)
                  }
                }
              }
            }
          )
        }
      }
    }
  ).catch(convertThrowIntoFetchResult)

  if (result?.data?.streamsDelete) {
    closeProjectDeleteDialog()
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Project deleted',
      description: 'The project has been successfully deleted'
    })
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to delete project',
      description: errorMessage
    })
  }
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
