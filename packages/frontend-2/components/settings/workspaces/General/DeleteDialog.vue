<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Delete workspace"
    max-width="sm"
    :buttons="dialogButtons"
  >
    <p class="text-body-xs text-foreground mb-2">
      Are you sure you want to permanently delete
      <span class="font-medium">{{ workspace?.name }}?</span>
      This action cannot be undone.
    </p>
    <FormTextInput
      v-model="workspaceNameInput"
      name="workspaceNameConfirm"
      label="To confirm deletion, type the workspace name below."
      placeholder="Type the workspace name here..."
      full-width
      show-label
      hide-error-message
      class="text-sm mb-2"
      color="foundation"
    />
  </LayoutDialog>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type {
  SettingsWorkspaceGeneralDeleteDialog_WorkspaceFragment,
  UserWorkspacesArgs,
  User
} from '~/lib/common/generated/gql/graphql'
import { FormTextInput, type LayoutDialogButton } from '@speckle/ui-components'
import { useMutation, useApolloClient } from '@vue/apollo-composable'
import { deleteWorkspaceMutation } from '~/lib/settings/graphql/mutations'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage,
  getCacheId,
  modifyObjectFields
} from '~~/lib/common/helpers/graphql'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { isUndefined } from 'lodash-es'
import { homeRoute } from '~/lib/common/helpers/route'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { useSetActiveWorkspace } from '~/lib/user/composables/activeWorkspace'

graphql(`
  fragment SettingsWorkspaceGeneralDeleteDialog_Workspace on Workspace {
    id
    name
  }
`)

const props = defineProps<{
  workspace: MaybeNullOrUndefined<SettingsWorkspaceGeneralDeleteDialog_WorkspaceFragment>
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const { mutate: deleteWorkspace } = useMutation(deleteWorkspaceMutation)
const { triggerNotification } = useGlobalToast()
const { activeUser } = useActiveUser()
const router = useRouter()
const apollo = useApolloClient().client
const { setActiveWorkspace } = useSetActiveWorkspace()

const workspaceNameInput = ref('')

const onDelete = async () => {
  if (!props.workspace) return
  if (workspaceNameInput.value !== props.workspace.name) return

  // Create a copy of the workspace name and ID before deletion to avoid errors after deletion/cache update
  const { name: workspaceName } = props.workspace
  const cache = apollo.cache
  const result = await deleteWorkspace({
    workspaceId: props.workspace.id
  }).catch(convertThrowIntoFetchResult)

  if (result?.data) {
    if (activeUser.value) {
      cache.evict({
        id: getCacheId('Workspace', props.workspace.id)
      })

      modifyObjectFields<UserWorkspacesArgs, User['workspaces']>(
        cache,
        activeUser.value.id,
        (_fieldName, variables, value, { DELETE }) => {
          if (variables?.filter?.search?.length) return DELETE

          const newTotalCount = isUndefined(value?.totalCount)
            ? undefined
            : Math.max(0, (value?.totalCount || 0) - 1)

          return {
            ...value,
            ...(isUndefined(newTotalCount) ? {} : { totalCount: newTotalCount })
          }
        },
        { fieldNameWhitelist: ['workspaces'] }
      )
    }

    triggerNotification({
      type: ToastNotificationType.Success,
      title: `${workspaceName} workspace deleted`
    })

    await setActiveWorkspace({ id: null })
    router.push(homeRoute)
    isOpen.value = false
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to delete workspace',
      description: errorMessage
    })
  }
}

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Delete',
    props: {
      color: 'danger',
      disabled: workspaceNameInput.value !== props.workspace?.name
    },
    onClick: onDelete
  }
])
</script>
