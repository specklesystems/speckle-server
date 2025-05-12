<template>
  <div class="space-y-2">
    <div class="space-y-2 relative">
      <div
        v-if="workspacesEnabled && workspaces"
        class="flex items-center space-x-2 bg-foundation -mx-3 -mt-2 px-3 py-2 shadow-sm border-b"
      >
        <div class="flex-grow min-w-0">
          <div v-if="workspaces.length === 0">
            <FormButton
              full-width
              class="flex items-center"
              @click="$openUrl('https://app.speckle.systems/workspaces/actions/create')"
            >
              <div class="min-w-0 truncate flex-grow">
                <span>{{ 'Create a workspace' }}</span>
              </div>
              <ArrowTopRightOnSquareIcon class="w-4" />
            </FormButton>
          </div>
          <WorkspaceMenu
            v-else-if="selectedWorkspace"
            :workspaces="workspaces"
            :current-selected-workspace-id="selectedWorkspace.id"
            @workspace:selected="(workspace: WorkspaceListWorkspaceItemFragment) => handleWorkspaceSelected(workspace)"
          >
            <template #activator="{ toggle }">
              <button
                v-tippy="'Click to change the workspace'"
                class="flex items-center w-full p-1 space-x-2 bg-foundation hover:bg-primary-muted rounded text-foreground border"
                @click="toggle()"
              >
                <WorkspaceAvatar
                  :size="'xs'"
                  :name="selectedWorkspace.name || ''"
                  :logo="selectedWorkspace.logo"
                />
                <div class="min-w-0 truncate flex-grow text-left">
                  <span>{{ selectedWorkspace.name }}</span>
                </div>
                <ChevronDownIcon class="h-3 w-3 shrink-0" />
              </button>
            </template>
          </WorkspaceMenu>
        </div>
        <div class="px-0.5 shrink-0">
          <AccountsMenu
            :current-selected-account-id="accountId"
            @select="(e) => selectAccount(e)"
          />
        </div>
      </div>
      <!-- we can message to user about the non-workspace scenario -->
      <!-- <div v-if="workspaces && workspaces.length === 0">
        <CommonAlert size="xs" :color="'warning'">
          <template #description>
            You are listing legacy personal projects which will be deprecated end of
            2025. We suggest you to move your personal projects into a workspace before
            then.
          </template>
        </CommonAlert>
      </div> -->
      <div class="space-y-2">
        <div class="flex items-center space-x-1 justify-between">
          <FormTextInput
            v-model="searchText"
            placeholder="Search your projects"
            name="search"
            autocomplete="off"
            :show-clear="!!searchText"
            full-width
            color="foundation"
          />
          <div class="flex justify-between items-center space-x-2">
            <ProjectCreateWorkspaceDialog
              v-if="selectedWorkspace && selectedWorkspace.id !== 'personalProject'"
              :workspace="selectedWorkspace"
              @project:created="(result : ProjectListProjectItemFragment) => handleProjectCreated(result)"
            >
              <template #activator="{ toggle }">
                <button
                  v-tippy="'New project in workspace'"
                  class="p-1.5 bg-foundation hover:bg-primary-muted rounded text-foreground border"
                  @click="toggle()"
                >
                  <PlusIcon class="w-4" />
                </button>
              </template>
            </ProjectCreateWorkspaceDialog>
            <!-- TODO: once we deprecate personal projects, else block is bye bye -->
            <ProjectCreatePersonalDialog
              v-else
              @project:created="(result : ProjectListProjectItemFragment) => handleProjectCreated(result)"
            >
              <template #activator="{ toggle }">
                <button
                  v-tippy="'New personal project'"
                  class="p-1.5 bg-foundation hover:bg-primary-muted rounded text-foreground border"
                  @click="toggle()"
                >
                  <PlusIcon class="w-4" />
                </button>
              </template>
            </ProjectCreatePersonalDialog>
            <div v-if="!workspacesEnabled || !workspaces" class="mt-1">
              <AccountsMenu
                :current-selected-account-id="accountId"
                @select="(e) => selectAccount(e)"
              />
            </div>
          </div>
        </div>
        <CommonLoadingBar v-if="loading" loading />
      </div>
      <div class="grid grid-cols-1 gap-2 relative z-0">
        <WizardListProjectCard
          v-for="project in projects"
          :key="project.id"
          :project="project"
          :is-sender="isSender"
          @click="handleProjectCardClick(project)"
        />
        <FormButton
          full-width
          :disabled="hasReachedEnd"
          color="outline"
          @click="loadMore"
        >
          {{ hasReachedEnd ? 'No more projects found' : 'Load older projects' }}
        </FormButton>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ChevronDownIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline'
import { storeToRefs } from 'pinia'
import { PlusIcon } from '@heroicons/vue/20/solid'
import type { DUIAccount } from '~/store/accounts'
import { useAccountStore } from '~/store/accounts'
import {
  activeWorkspaceQuery,
  projectsListQuery,
  serverInfoQuery,
  setActiveWorkspaceMutation,
  workspacesListQuery
} from '~/lib/graphql/mutationsAndQueries'
import { useMutation, provideApolloClient, useQuery } from '@vue/apollo-composable'
import type {
  ProjectListProjectItemFragment,
  WorkspaceListWorkspaceItemFragment
} from 'lib/common/generated/gql/graphql'
import { useMixpanel } from '~/lib/core/composables/mixpanel'
import { useConfigStore } from '~/store/config'

const { trackEvent } = useMixpanel()
const { $openUrl } = useNuxtApp()

const emit = defineEmits<{
  (
    e: 'next',
    accountId: string,
    project: ProjectListProjectItemFragment,
    workspace?: WorkspaceListWorkspaceItemFragment // NOTE: this nullabilities will disappear whenever we are workspace only
  ): void
  (e: 'search-text-update', text: string | undefined): void
}>()

const props = withDefaults(
  defineProps<{
    isSender: boolean
    showNewProject?: boolean
    /**
     * For the send wizard - not allowing selecting projects we can't write to.
     */
    disableNoWriteAccessProjects?: boolean
  }>(),
  {
    showNewProject: true,
    disableNoWriteAccessProjects: false
  }
)

const searchText = ref<string>()
const newProjectName = ref<string>()
const accountStore = useAccountStore()
const configStore = useConfigStore()
const { activeAccount } = storeToRefs(accountStore)

const accountId = computed(() => activeAccount.value.accountInfo.id)

watch(searchText, () => {
  newProjectName.value = searchText.value
  emit('search-text-update', searchText.value)
})

// TODO: this function is never triggered!! remove or evaluate
const selectAccount = (account: DUIAccount) => {
  refetchServerInfo() // to be able to understand workspaces enabled or not
  refetchActiveWorkspace()
  refetchWorkspaces()
  void trackEvent('DUI3 Action', { name: 'Account Select' }, account.accountInfo.id)
}

const handleProjectCreated = (result: ProjectListProjectItemFragment) => {
  refetch() // Sorts the list with newly created project otherwise it will put the project at the bottom.
  emit('next', accountId.value, result)
}

const { result: serverInfoResult, refetch: refetchServerInfo } = useQuery(
  serverInfoQuery,
  () => ({}),
  () => ({ clientId: accountId.value, debounce: 500, fetchPolicy: 'network-only' })
)

const workspacesEnabled = computed(
  () => serverInfoResult.value?.serverInfo.workspaces.workspacesEnabled
)

const { result: workspacesResult, refetch: refetchWorkspaces } = useQuery(
  workspacesListQuery,
  () => ({
    limit: 100
  }),
  () => ({ clientId: accountId.value, debounce: 500, fetchPolicy: 'network-only' })
)

const workspaces = computed(() => workspacesResult.value?.activeUser?.workspaces.items)

const { result: activeWorkspaceResult, refetch: refetchActiveWorkspace } = useQuery(
  activeWorkspaceQuery,
  () => ({}),
  () => ({ clientId: accountId.value, debounce: 500, fetchPolicy: 'network-only' })
)

const activeWorkspace = computed(() => {
  const userSelectedWorkspaceId = configStore.userSelectedWorkspaceId
  if (userSelectedWorkspaceId) {
    const previouslySelectedWorkspace = workspaces.value?.find(
      (w) => w.id === userSelectedWorkspaceId
    )
    if (previouslySelectedWorkspace) {
      return previouslySelectedWorkspace
    }
  }
  // fallback to activeWorkspace query result
  return activeWorkspaceResult.value?.activeUser
    ?.activeWorkspace as WorkspaceListWorkspaceItemFragment
})

const selectedWorkspace = ref<WorkspaceListWorkspaceItemFragment | undefined>(
  activeWorkspace.value
)

watch(
  workspaces,
  (newItems) => {
    if (newItems && newItems.length > 0) {
      selectedWorkspace.value = activeWorkspace.value ?? newItems[0]
    } else {
      selectedWorkspace.value = undefined
    }
  },
  { immediate: true }
)

const handleProjectCardClick = (project: ProjectListProjectItemFragment) => {
  if (
    props.isSender
      ? project.permissions.canPublish.authorized
      : project.permissions.canLoad.authorized
  ) {
    emit('next', accountId.value, project, selectedWorkspace.value)
  }
}

const handleWorkspaceSelected = async (
  newSelectedWorkspace: WorkspaceListWorkspaceItemFragment
) => {
  selectedWorkspace.value = newSelectedWorkspace
  const account = computed(() => {
    return accountStore.accounts.find(
      (acc) => acc.accountInfo.id === accountId.value
    ) as DUIAccount
  })
  const { mutate } = provideApolloClient(account.value.client)(() =>
    useMutation(setActiveWorkspaceMutation)
  )
  try {
    await mutate({ slug: newSelectedWorkspace.slug })
  } catch (error) {
    // I dont believe we should throw toast for this, but good to be critical on console
    console.error(error)
  }

  configStore.setUserSelectedWorkspace(newSelectedWorkspace.id)
}

// This is a hack for people who don't have a workspace and have personal projects only.
const timeoutWait = ref(false)

const filtersReady = computed(
  () => selectedWorkspace.value !== undefined || timeoutWait.value
)

onMounted(() => {
  setTimeout(() => {
    timeoutWait.value = true
  }, 1000)
})

const {
  result: projectsResult,
  loading,
  fetchMore,
  refetch
} = useQuery(
  projectsListQuery,
  () => ({
    limit: 10, // stupid hack, increased it since we do manual filter to be able to see more project, see below TODO note, once we have `personalOnly` filter, decrease back to 10
    filter: {
      search: (searchText.value || '').trim() || null,
      workspaceId:
        selectedWorkspace.value?.id === 'personalProject'
          ? null
          : selectedWorkspace.value?.id,
      includeImplicitAccess: true,
      personalOnly: selectedWorkspace.value?.id === 'personalProject'
    }
  }),
  () => ({
    enabled: filtersReady.value,
    clientId: accountId.value,
    debounce: 500,
    fetchPolicy: 'network-only'
  })
)

const projects = computed(() =>
  selectedWorkspace.value?.id === 'personalProject' // TODO: we need to replace this logic with `personalOnly` filter when it is implemented into app.speckle.systems
    ? projectsResult.value?.activeUser?.projects.items.filter(
        (i) => i.workspaceId === null
      )
    : projectsResult.value?.activeUser?.projects.items
)
const hasReachedEnd = ref(false)

watch(searchText, () => {
  hasReachedEnd.value = false
})

watch(projectsResult, (newVal) => {
  if (
    newVal &&
    newVal.activeUser &&
    newVal?.activeUser?.projects.items.length >= newVal?.activeUser?.projects.totalCount
  ) {
    hasReachedEnd.value = true
  } else {
    hasReachedEnd.value = false
  }
})

const loadMore = () => {
  fetchMore({
    variables: { cursor: projectsResult.value?.activeUser?.projects.cursor },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult || fetchMoreResult.activeUser?.projects.items.length === 0) {
        hasReachedEnd.value = true
        return previousResult
      }

      if (!previousResult.activeUser || !fetchMoreResult.activeUser)
        return previousResult

      return {
        activeUser: {
          id: previousResult.activeUser?.id,
          __typename: previousResult.activeUser?.__typename,
          projects: {
            __typename: previousResult.activeUser?.projects.__typename,
            cursor: fetchMoreResult?.activeUser?.projects.cursor,
            totalCount: fetchMoreResult?.activeUser?.projects.totalCount,
            items: [
              ...previousResult.activeUser.projects.items,
              ...fetchMoreResult.activeUser.projects.items
            ]
          }
        }
      }
    }
  })
}
</script>
