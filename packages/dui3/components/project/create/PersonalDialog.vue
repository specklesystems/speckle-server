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
            :disabled="isCreatingProject || !canCreatePersonalProject"
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

const emit = defineEmits<{
  (e: 'project:created', result: ProjectListProjectItemFragment): void
}>()

const { trackEvent } = useMixpanel()
const accountStore = useAccountStore()
const hostAppStore = useHostAppStore()
const { activeAccount } = storeToRefs(accountStore)

const accountId = computed(() => activeAccount.value.accountInfo.id)
const newProjectName = ref<string>()

const errorMessage = ref<string>()

const toggleDialog = () => {
  showProjectCreateDialog.value = !showProjectCreateDialog.value
}

const account = computed(() => {
  return accountStore.accounts.find(
    (acc) => acc.accountInfo.id === accountId.value
  ) as DUIAccount
})

const canCreatePersonalProject = ref<boolean>(false)

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
    errorMessage.value = val?.activeUser?.permissions.canCreatePersonalProject.message
    canCreatePersonalProject.value = false
  } else {
    canCreatePersonalProject.value = true
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
</script>
