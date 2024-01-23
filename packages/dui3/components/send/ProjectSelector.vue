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
          <div
            class="absolute top-6 caption right-3 opacity-0 transition group-hover:opacity-100 rounded-md bg-primary text-foreground-on-primary p-1"
          >
            select
          </div>
        </div>
        <div class="caption text-center mt-2">{{ totalCount }} projects found.</div>
      </div>
    </div>
    <button
      v-if="showNewProject"
      v-tippy="'create new project'"
      class="fixed bottom-2 flex items-center justify-center right-2 z-100 w-12 h-12 rounded-full bg-primary text-foreground-on-primary"
      @click="showNewProjectDialog = true"
    >
      <PlusIcon class="w-6 h-6" />
    </button>
    <LayoutDialog v-model:open="showNewProjectDialog" hide-closer title="new project">
      <!-- <div class="-mx-6 -my-5 space-y-2"> -->
      <form @submit="onSubmit">
        <FormTextInput
          v-model="newProjectName"
          placeholder="new project name"
          name="new project name"
          :show-clear="!!newProjectName"
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
import { useAccountStore } from '~/store/accounts'
import { projectsListQuery } from '~/lib/graphql/mutationsAndQueries'
import { useQuery } from '@vue/apollo-composable'
import { ProjectListProjectItemFragment } from 'lib/common/generated/gql/graphql'
import { useForm } from 'vee-validate'

defineEmits<{
  (e: 'next', accountId: string, project: ProjectListProjectItemFragment): void
}>()

const props = withDefaults(
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
const onSubmit = handleSubmit(async ({ name }) => {
  // await createModel({ name, projectId: props.projectId })
  // mp.track('Branch Action', { type: 'action', name: 'create', mode: 'dialog' })
  // openState.value = false
})

const { result: projectsResult, loading } = useQuery(
  projectsListQuery,
  () => ({
    limit: 5,
    filter: {
      search: (searchText.value || '').trim() || null
    }
  }),
  () => ({ clientId: accountId.value, debounce: 500 })
)

const projects = computed(() => projectsResult.value?.activeUser?.projects.items)
const totalCount = computed(() => projectsResult.value?.activeUser?.projects.totalCount)
</script>
