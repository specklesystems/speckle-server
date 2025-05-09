<template>
  <div class="p-0">
    <slot name="activator" :toggle="toggleDialog"></slot>
    <CommonDialog
      v-model:open="showModelCreateDialog"
      :title="canCreateModelInWorkspace ? `Create new model` : errorMessage?.title"
      fullscreen="none"
    >
      <form v-if="canCreateModelInWorkspace" @submit="onSubmitCreateNewModel">
        <div class="text-body-2xs mb-2 ml-1">Model name</div>
        <FormTextInput
          v-model="newModelName"
          class="text-xs"
          autocomplete="off"
          name="name"
          label="Model name"
          color="foundation"
          :show-clear="!!newModelName"
          :placeholder="hostAppStore.documentInfo?.name"
          :rules="[
            ValidationHelpers.isRequired,
            ValidationHelpers.isStringOfLength({ minLength: 3 })
          ]"
          full-width
        />
        <div class="mt-4 flex justify-end items-center space-x-2 w-full">
          <FormButton size="sm" text @click="showModelCreateDialog = false">
            Cancel
          </FormButton>
          <FormButton size="sm" submit :disabled="isCreatingModel">Create</FormButton>
        </div>
      </form>
      <div v-else class="m-2">
        {{ errorMessage?.description }}
        <div class="flex mt-2 space-x-2 justify-end">
          <FormButton size="sm" color="outline" @click="showModelCreateDialog = false">
            Close
          </FormButton>
          <FormButton
            v-if="errorMessage?.cta"
            size="sm"
            submit
            @click="errorMessage?.cta?.action(), (showModelCreateDialog = false)"
          >
            {{ errorMessage?.cta?.name }}
          </FormButton>
        </div>
      </div>
    </CommonDialog>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useMutation, provideApolloClient, useQuery } from '@vue/apollo-composable'
import type { ModelListModelItemFragment } from '~/lib/common/generated/gql/graphql'
import { useForm } from 'vee-validate'
import { ValidationHelpers } from '@speckle/ui-components'
import type { DUIAccount } from '~/store/accounts'
import { useAccountStore } from '~/store/accounts'
import { useMixpanel } from '~/lib/core/composables/mixpanel'
import { useHostAppStore } from '~/store/hostApp'
import {
  canCreateModelInProjectQuery,
  createModelMutation
} from '~/lib/graphql/mutationsAndQueries'

type WorkspacePermissionMessage = {
  title: string
  description: string
  cta?: {
    name: string
    action: () => void
  }
}

const { $openUrl } = useNuxtApp()

const showModelCreateDialog = ref(false)
const isCreatingModel = ref(false)

const props = defineProps<{
  projectId: string
  workspaceId?: string
  workspaceSlug?: string
}>()

const emit = defineEmits<{
  (e: 'model:created', model: ModelListModelItemFragment): void
}>()

const { trackEvent } = useMixpanel()
const accountStore = useAccountStore()
const hostAppStore = useHostAppStore()
const { activeAccount } = storeToRefs(accountStore)

const accountId = computed(() => activeAccount.value.accountInfo.id)
const newModelName = ref<string>()
const errorMessage = ref<WorkspacePermissionMessage>()

const toggleDialog = () => {
  showModelCreateDialog.value = !showModelCreateDialog.value
}

const account = computed(() => {
  return accountStore.accounts.find(
    (acc) => acc.accountInfo.id === accountId.value
  ) as DUIAccount
})

const canCreateModelInWorkspace = ref<boolean>()

const { result: canCreateModelInWorkspaceResult } = useQuery(
  canCreateModelInProjectQuery,
  () => ({ projectId: props.projectId }),
  () => ({
    clientId: accountId.value,
    debounce: 500,
    fetchPolicy: 'network-only'
  })
)

watch(canCreateModelInWorkspaceResult, (val) => {
  if (val?.project.permissions.canCreateModel.code !== 'OK') {
    switch (val?.project.permissions.canCreateModel.code) {
      case 'WorkspaceLimitsReached':
        errorMessage.value = {
          title: 'Plan limit reached',
          description:
            'The model limit for this workspace has been reached. Upgrade the workspace plan to create or move more models.',
          cta: {
            name: 'Explore Plans',
            action: () =>
              $openUrl(
                `${account.value.accountInfo.serverInfo.url}/settings/workspaces/${props.workspaceSlug}/billing`
              )
          }
        }
        break
      // TODO: we should add more cases later according to `code`
      default:
        errorMessage.value = {
          title: 'Workspace warning',
          description: val?.project.permissions.canCreateModel.message ?? 'error'
        }
        break
    }
    canCreateModelInWorkspace.value = false
  } else {
    canCreateModelInWorkspace.value = true
  }
})

const createNewModel = async (name: string) => {
  isCreatingModel.value = true

  void trackEvent('DUI3 Action', { name: 'Model Create' }, account.value.accountInfo.id)

  const { mutate } = provideApolloClient(account.value.client)(() =>
    useMutation(createModelMutation)
  )
  const res = await mutate({ input: { projectId: props.projectId, name } })
  if (res?.data?.modelMutations.create) {
    emit('model:created', res?.data?.modelMutations.create)
    // refetch() // Sorts the list with newly created model otherwise it will put the model at the bottom.
    // emit('next', res?.data?.modelMutations.create)
  } else {
    let errorMessage = 'Undefined error'
    if (res?.errors && res?.errors.length !== 0) {
      errorMessage = res?.errors[0].message
    }

    hostAppStore.setNotification({
      type: 1,
      title: 'Failed to create model',
      description: errorMessage
    })
  }
  isCreatingModel.value = false
}

const { handleSubmit } = useForm<{ name: string }>()
const onSubmitCreateNewModel = handleSubmit(() => {
  void createNewModel(newModelName.value as string)
})
</script>
