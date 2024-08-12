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
      {{ workspaceName }}
    </div>
    <p>
      This action
      <span class="font-medium">cannot</span>
      be undone.
    </p>
  </LayoutDialog>
</template>
<script setup lang="ts">
import type { WorkspaceCollection } from '~/lib/common/generated/gql/graphql'
import type { LayoutDialogButton } from '@speckle/ui-components'
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

const props = defineProps<{
  workspaceId: string
  workspaceName: string
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const { mutate: deleteWorkspace } = useMutation(deleteWorkspaceMutation)
const { triggerNotification } = useGlobalToast()
const { activeUser } = useActiveUser()
const apollo = useApolloClient().client

const onDelete = async () => {
  isOpen.value = false

  const cache = apollo.cache
  const result = await deleteWorkspace({
    workspaceId: props.workspaceId
  }).catch(convertThrowIntoFetchResult)

  if (result?.data) {
    if (activeUser.value) {
      const cacheId = getCacheId('Workspace', props.workspaceId)
      cache.evict({
        id: cacheId
      })

      modifyObjectFields<{ workspaces: WorkspaceCollection }, WorkspaceCollection>(
        cache,
        activeUser.value.id,
        (fieldName, _variables, value) => {
          const oldItems = value?.items || []
          const newItems = oldItems.filter((i) => i?.__ref !== cacheId)
          return {
            ...value,
            items: newItems,
            totalCount: Math.max(0, (value?.totalCount || 0) - 1)
          }
        },
        { fieldNameWhitelist: ['workspaces'] }
      )
    }

    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Workspace deleted',
      description: `The ${props.workspaceName} workspace has been deleted`
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
