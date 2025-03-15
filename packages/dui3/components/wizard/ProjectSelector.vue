<template>
  <div class="space-y-2">
    <div class="space-y-2 relative">
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
          <div class="flex space-x-2">
            <button
              v-if="showNewProject"
              v-tippy="'New project'"
              class="p-1 hover:bg-primary-muted rounded text-foreground-2"
              @click="showNewProjectDialog = true"
            >
              <PlusIcon class="w-4" />
            </button>
            <div class="mt-1">
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
          :disable-no-write-access-projects="disableNoWriteAccessProjects"
          @click="handleProjectCardClick(project)"
        />
        <FormButton
          v-if="searchText && hasReachedEnd && showNewProject"
          full-width
          @click="createNewProject(searchText)"
        >
          Create&nbsp;
          <div class="truncate">"{{ searchText }}"</div>
        </FormButton>
        <FormButton
          v-else
          full-width
          :disabled="hasReachedEnd"
          color="outline"
          @click="loadMore"
        >
          {{ hasReachedEnd ? 'No more projects found' : 'Load older projects' }}
        </FormButton>
      </div>
    </div>
    <CommonDialog
      v-model:open="showNewProjectDialog"
      title="Create new project"
      fullscreen="none"
    >
      <form @submit="onSubmitCreateNewProject">
        <div class="text-body-2xs mb-2 ml-1">Project name</div>
        <FormTextInput
          v-model="newProjectName"
          class="mb-4"
          placeholder="A Beautiful Home, A Small Bridge..."
          autocomplete="off"
          name="name"
          label="Project name"
          color="foundation"
          :show-clear="!!newProjectName"
          :rules="[
            ValidationHelpers.isRequired,
            ValidationHelpers.isStringOfLength({ minLength: 3 })
          ]"
          full-width
        />
        <WizardWorkspaceSelector
          v-if="workspacesEnabled"
          @update:selected-workspace="(args) => setWorkspace(args as WorkspaceListWorkspaceItemFragment )"
        ></WizardWorkspaceSelector>
        <div class="mt-4 flex justify-end items-center space-x-2 w-full">
          <FormButton size="sm" text @click="showNewProjectDialog = false">
            Cancel
          </FormButton>
          <FormButton size="sm" submit>Create</FormButton>
        </div>
      </form>
    </CommonDialog>
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { PlusIcon } from '@heroicons/vue/20/solid'
import type { DUIAccount } from '~/store/accounts'
import { useAccountStore } from '~/store/accounts'
import {
  createProjectInWorkspaceMutation,
  createProjectMutation,
  projectsListQuery,
  serverInfoQuery
} from '~/lib/graphql/mutationsAndQueries'
import { useMutation, useQuery, provideApolloClient } from '@vue/apollo-composable'
import type {
  ProjectListProjectItemFragment,
  WorkspaceListWorkspaceItemFragment
} from 'lib/common/generated/gql/graphql'
import { useForm } from 'vee-validate'
import { ValidationHelpers } from '@speckle/ui-components'
import { useMixpanel } from '~/lib/core/composables/mixpanel'

const { trackEvent } = useMixpanel()

const emit = defineEmits<{
  (e: 'next', accountId: string, project: ProjectListProjectItemFragment): void
  (e: 'search-text-update', text: string | undefined): void
}>()

const props = withDefaults(
  defineProps<{
    showNewProject?: boolean
    /**
     * For the send wizard - not allowing selecting projects we can't write to.
     */
    disableNoWriteAccessProjects?: boolean
  }>(),
  { showNewProject: true, disableNoWriteAccessProjects: false }
)

const setWorkspace = (args: WorkspaceListWorkspaceItemFragment) => {
  selectedWorkspace.value = args
}

const selectedWorkspace = ref<WorkspaceListWorkspaceItemFragment>()

const searchText = ref<string>()
const newProjectName = ref<string>()

const showNewProjectDialog = ref(false)
const accountStore = useAccountStore()
const { activeAccount } = storeToRefs(accountStore)

const accountId = computed(() => activeAccount.value.accountInfo.id)
const selectedAccountId = ref<string>()

watch(searchText, () => {
  newProjectName.value = searchText.value
  emit('search-text-update', searchText.value)
})

// TODO: this function is never triggered!! remove or evaluate
const selectAccount = (account: DUIAccount) => {
  selectedAccountId.value = account.accountInfo.id
  void trackEvent('DUI3 Action', { name: 'Account Select' }, account.accountInfo.id)
}

const { handleSubmit } = useForm<{ name: string }>()
const onSubmitCreateNewProject = handleSubmit(() => {
  // TODO: Chat with Fabians
  // This works, but if we use handleSubmit(args) > args.name -> it is undefined in Production on netlify, but works fine on local dev
  void createNewProject(newProjectName.value as string)
})

const handleProjectCardClick = (project: ProjectListProjectItemFragment) => {
  // TODO: error
  if (
    props.disableNoWriteAccessProjects &&
    (!project.role || project.role === 'stream:reviewer')
  ) {
    return
  }
  emit('next', accountId.value, project)
}

const account = computed(() => {
  return accountStore.accounts.find(
    (acc) => acc.accountInfo.id === accountId.value
  ) as DUIAccount
})

const createNewProject = async (name: string) => {
  if (selectedWorkspace.value) {
    return createNewProjectInWorkspace(name)
  }

  void trackEvent(
    'DUI3 Action',
    { name: 'Project Create', workspace: false },
    account.value.accountInfo.id
  )
  const { mutate } = provideApolloClient(account.value.client)(() =>
    useMutation(createProjectMutation)
  )
  const res = await mutate({ input: { name } })
  if (res?.data?.projectMutations.create) {
    refetch() // Sorts the list with newly created project otherwise it will put the project at the bottom.
    emit('next', accountId.value, res?.data?.projectMutations.create)
  } else {
    // TODO: Error out
  }
}

const createNewProjectInWorkspace = async (name: string) => {
  void trackEvent(
    'DUI3 Action',
    { name: 'Project Create', workspace: true },
    account.value.accountInfo.id
  )
  const { mutate } = provideApolloClient(account.value.client)(() =>
    useMutation(createProjectInWorkspaceMutation)
  )
  const res = await mutate({
    input: { name, workspaceId: selectedWorkspace.value?.id as string }
  })
  if (res?.data?.workspaceMutations.projects.create) {
    refetch() // Sorts the list with newly created project otherwise it will put the project at the bottom.
    emit('next', accountId.value, res?.data?.workspaceMutations.projects.create)
  } else {
    // TODO: Error out
  }
}

const { result: serverInfoResult } = useQuery(
  serverInfoQuery,
  () => ({}),
  () => ({ clientId: accountId.value, debounce: 500, fetchPolicy: 'network-only' })
)

const workspacesEnabled = computed(
  () => serverInfoResult.value?.serverInfo.workspaces.workspacesEnabled
)

const {
  result: projectsResult,
  loading,
  fetchMore,
  refetch
} = useQuery(
  projectsListQuery,
  () => ({
    limit: 10,
    filter: {
      search: (searchText.value || '').trim() || null
    }
  }),
  () => ({ clientId: accountId.value, debounce: 500, fetchPolicy: 'network-only' })
)

const projects = computed(() => projectsResult.value?.activeUser?.projects.items)
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
