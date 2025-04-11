<template>
  <div class="p-0">
    <slot name="activator" :toggle="toggleDialog"></slot>
    <CommonDialog
      v-model:open="showProjectCreateDialog"
      :title="`Create new project`"
      fullscreen="none"
    >
      <form @submit="onSubmitCreateNewProject">
        <div class="text-body-2xs mb-2 ml-1">Project name</div>
        <FormTextInput
          v-model="newProjectName"
          class="text-xs"
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
        <div class="mt-4 flex justify-end items-center space-x-2 w-full">
          <FormButton size="sm" text @click="showProjectCreateDialog = false">
            Cancel
          </FormButton>
          <FormButton
            size="sm"
            submit
            :disabled="isCreatingProject || !canCreateProject"
          >
            Create
          </FormButton>
        </div>
      </form>
    </CommonDialog>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useMutation, provideApolloClient, useQuery } from '@vue/apollo-composable'
import type { ProjectListProjectItemFragment } from '~/lib/common/generated/gql/graphql'
import {
  canCreatePersonalProjectQuery,
  canCreateProjectInWorkspaceQuery,
  createProjectInWorkspaceMutation,
  createProjectMutation
} from '~/lib/graphql/mutationsAndQueries'
import type { DUIAccount } from '~/store/accounts'
import { useAccountStore } from '~/store/accounts'
import { useMixpanel } from '~/lib/core/composables/mixpanel'
import { useHostAppStore } from '~/store/hostApp'
import { useForm } from 'vee-validate'
import { ValidationHelpers } from '@speckle/ui-components'

const showProjectCreateDialog = ref(false)
const isCreatingProject = ref(false)

const props = defineProps<{ workspaceId?: string }>()

const emit = defineEmits<{
  (e: 'project:created', result: ProjectListProjectItemFragment): void
}>()

const { trackEvent } = useMixpanel()
const accountStore = useAccountStore()
const hostAppStore = useHostAppStore()
const { activeAccount } = storeToRefs(accountStore)

const accountId = computed(() => activeAccount.value.accountInfo.id)
const newProjectName = ref<string>()

const errorMessageForWorkspace = ref<string>()
const errorMessageForPersonalProject = ref<string>()

const toggleDialog = () => {
  showProjectCreateDialog.value = !showProjectCreateDialog.value
}

const account = computed(() => {
  return accountStore.accounts.find(
    (acc) => acc.accountInfo.id === accountId.value
  ) as DUIAccount
})

const canCreateProject = computed(() =>
  props.workspaceId === 'personalProject'
    ? canCreatePersonalProject.value
    : canCreateProjectInWorkspace.value
)

const { result: canCreatePersonalProjectResult } = useQuery(
  canCreatePersonalProjectQuery,
  () => ({}),
  () => ({
    clientId: accountId.value,
    debounce: 500,
    fetchPolicy: 'network-only'
  })
)

watch(canCreatePersonalProjectResult, (val) => {
  if (val?.activeUser?.permissions.canCreatePersonalProject.code !== 'OK') {
    errorMessageForPersonalProject.value =
      val?.activeUser?.permissions.canCreatePersonalProject.message
  }
})

const canCreatePersonalProject = computed(() => {
  try {
    return (
      canCreatePersonalProjectResult.value?.activeUser?.permissions
        .canCreatePersonalProject.code === 'OK'
    )
  } catch {
    return true
  }
})

const { result: canCreateProjectInWorkspaceResult } = useQuery(
  canCreateProjectInWorkspaceQuery,
  () => ({ workspaceId: props.workspaceId ?? 'null' }), // TODO: i do not know the potential cause here
  () => ({
    clientId: accountId.value,
    debounce: 500,
    fetchPolicy: 'network-only'
  })
)

watch(canCreateProjectInWorkspaceResult, (val) => {
  if (val?.workspace.permissions.canCreateProject.code !== 'OK') {
    errorMessageForWorkspace.value = val?.workspace.permissions.canCreateProject.message
  }
})

const canCreateProjectInWorkspace = computed(() => {
  try {
    return (
      canCreateProjectInWorkspaceResult.value?.workspace.permissions.canCreateProject
        .code === 'OK'
    )
  } catch {
    return true
  }
})

const { handleSubmit } = useForm<{ name: string }>()
const onSubmitCreateNewProject = handleSubmit(() => {
  // TODO: Chat with Fabians
  // This works, but if we use handleSubmit(args) > args.name -> it is undefined in Production on netlify, but works fine on local dev
  void createNewProject(newProjectName.value as string)
})

const createNewProject = async (name: string) => {
  isCreatingProject.value = true

  if (props.workspaceId !== 'personalProject' && props.workspaceId !== undefined) {
    createNewProjectInWorkspace(name)
    isCreatingProject.value = false
    return
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
    emit('project:created', res?.data?.projectMutations.create)
  } else {
    let errorMessage = 'Undefined error'
    if (res?.errors && res?.errors.length !== 0) {
      errorMessage = res?.errors[0].message
    }

    hostAppStore.setNotification({
      type: 1,
      title: 'Failed to create project',
      description: errorMessage
    })
  }
  isCreatingProject.value = false
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
    input: { name, workspaceId: props.workspaceId as string }
  })
  if (res?.data?.workspaceMutations.projects.create) {
    emit('project:created', res?.data?.workspaceMutations.projects.create)
  } else {
    let errorMessage = 'Undefined error'
    if (res?.errors && res?.errors.length !== 0) {
      errorMessage = res?.errors[0].message
    }

    hostAppStore.setNotification({
      type: 1,
      title: 'Failed to create project',
      description: errorMessage
    })
  }
}
</script>
