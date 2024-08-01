<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Delete workspace"
    max-width="sm"
    :buttons="dialogButtons"
  >
    <p>
      Are you sure you want to
      <span class="font-medium">permanently delete</span>
      the selected workspace?
    </p>
    <div
      class="rounded border bg-foundation-2 border-outline-3 text-body-2xs text-foreground font-medium py-3 px-4 my-4"
    >
      {{ workspace.name }}
    </div>
    <p>
      This action
      <span class="font-medium">cannot</span>
      be undone.
    </p>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { useMutation } from '@vue/apollo-composable'
import { deleteWorkspaceMutation } from '~/lib/settings/graphql/mutations'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { graphql } from '~~/lib/common/generated/gql'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'

import type { SettingsWorkspaceGeneralDelete_WorkspaceFragment } from '~~/lib/common/generated/gql/graphql'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'

graphql(`
  fragment SettingsWorkspaceGeneralDelete_Workspace on Workspace {
    id
    name
  }
`)

const props = defineProps<{
  workspace: SettingsWorkspaceGeneralDelete_WorkspaceFragment
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const { mutate: deleteWorkspace } = useMutation(deleteWorkspaceMutation)
const { triggerNotification } = useGlobalToast()

const onDelete = async () => {
  const result = await deleteWorkspace({
    workspaceId: props.workspace.id
  }).catch(convertThrowIntoFetchResult)

  if (result?.data) {
    isOpen.value = false
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Workspace deleted',
      description: `The ${props.workspace.name} workspace has been deleted`
    })
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
    props: { color: 'outline', fullWidth: true },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Delete',
    props: {
      fullWidth: true,
      color: 'danger'
    },
    onClick: onDelete
  }
])
</script>
