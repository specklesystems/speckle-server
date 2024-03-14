<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="space-y-2">
    <div class="flex items-center space-x-2"></div>
    <div class="space-y-2">
      <div
        class="flex items-center space-x-2 justify-between items-center items-centre"
      >
        <FormTextInput
          v-model="searchText"
          placeholder="search"
          name="search"
          :show-clear="!!searchText"
          full-width
        />
        <div class="mt-1">
          <AccountsMenu
            :current-selected-account-id="accountId"
            @select="(e) => (selectedAccountId = e.accountInfo.id)"
          />
        </div>
      </div>
      <div class="grid grid-cols-1 gap-2">
        <CommonLoadingBar v-if="loading" loading />
        <div
          v-for="project in projects"
          :key="project.id"
          class="group relative bg-foundation-2 rounded p-2 hover:text-primary hover:bg-primary-muted transition cursor-pointer hover:shadow-md"
          @click="$emit('next', accountId, project)"
        >
          <div class="font-bold">{{ project.name }}</div>
          <div class="caption text-foreground-2">{{ project.role?.split(':')[1] }}</div>
          <div class="caption text-foreground-2">
            {{ new Date(project.updatedAt).toLocaleString() }}
          </div>
        </div>
        <div v-if="showNewProject && totalCount === 0 && searchText">
          <form @submit="createNewProject(searchText)">
            <FormButton
              full-width
              class="block truncate max-w-full overflow-hidden"
              @click="createNewProject(searchText)"
            >
              Create "{{ searchText }}"
            </FormButton>
          </form>
        </div>
        <div class="caption text-center mt-2">{{ totalCount }} projects found.</div>
      </div>
    </div>
    <button
      v-if="showNewProject && totalCount !== 0"
      v-tippy="'create new project'"
      class="fixed bottom-2 flex items-center justify-center right-2 z-100 w-12 h-12 rounded-full bg-primary text-foreground-on-primary"
      @click="showNewProjectDialog = true"
    >
      <PlusIcon class="w-6 h-6" />
    </button>
    <LayoutDialog
      v-model:open="showNewProjectDialog"
      hide-closer
      title="Create new project"
    >
      <!-- <div class="-mx-6 -my-5 space-y-2"> -->
      <!-- TODO -->
      <form @submit="onSubmitCreateNewProject">
        <FormTextInput
          v-model="newProjectName"
          placeholder="new project name"
          name="name"
          :show-clear="!!newProjectName"
          :rules="[
            ValidationHelpers.isRequired,
            ValidationHelpers.isStringOfLength({ minLength: 3 })
          ]"
          full-width
        />
        <div class="mt-2 flex">
          <FormButton text @click="showNewProjectDialog = false">Cancel</FormButton>
          <FormButton class="flex-grow" submit>Create</FormButton>
        </div>
      </form>
      <!-- </div> -->
    </LayoutDialog>
  </div>
</template>
<script setup lang="ts">
import { PlusIcon } from '@heroicons/vue/20/solid'
import { DUIAccount, useAccountStore } from '~/store/accounts'
import {
  createProjectMutation,
  projectsListQuery
} from '~/lib/graphql/mutationsAndQueries'
import { useMutation, useQuery, provideApolloClient } from '@vue/apollo-composable'
import { ProjectListProjectItemFragment } from 'lib/common/generated/gql/graphql'
import { useForm } from 'vee-validate'
import { ValidationHelpers } from '@speckle/ui-components'

const emit = defineEmits<{
  (e: 'next', accountId: string, project: ProjectListProjectItemFragment): void
}>()

withDefaults(
  defineProps<{
    showNewProject?: boolean
  }>(),
  { showNewProject: true }
)

const searchText = ref<string>()
const newProjectName = ref<string>()
const showNewProjectDialog = ref(false)
const accountStore = useAccountStore()
const { defaultAccount } = storeToRefs(accountStore)

const accountId = computed(
  () => selectedAccountId.value || (defaultAccount.value?.accountInfo.id as string)
)
const selectedAccountId = ref<string>()

const { handleSubmit } = useForm<{ name: string }>()
const onSubmitCreateNewProject = handleSubmit((args) => {
  void createNewProject(args.name)
})

const createNewProject = async (name: string) => {
  const account = accountStore.accounts.find(
    (acc) => acc.accountInfo.id === accountId.value
  ) as DUIAccount

  const { mutate } = provideApolloClient(account.client)(() =>
    useMutation(createProjectMutation)
  )
  const res = await mutate({ input: { name } })
  if (res?.data?.projectMutations.create) {
    emit('next', accountId.value, res?.data?.projectMutations.create)
  } else {
    // TODO: Error out
  }
}

const { result: projectsResult, loading } = useQuery(
  projectsListQuery,
  () => ({
    limit: 5,
    filter: {
      search: (searchText.value || '').trim() || null
    }
  }),
  () => ({ clientId: accountId.value, debounce: 500, fetchPolicy: 'cache-and-network' })
)

const projects = computed(() => projectsResult.value?.activeUser?.projects.items)
const totalCount = computed(() => projectsResult.value?.activeUser?.projects.totalCount)
</script>
