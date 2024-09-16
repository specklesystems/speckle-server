<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="xs"
    title="Delete webhook"
    :buttons="dialogButtons"
  >
    <div class="flex flex-col gap-2 text-body-xs text-foreground">
      <p>
        Are you sure you want to
        <strong>permanently delete</strong>
        the selected webhook?
      </p>
      <div v-if="webhook" class="flex flex-col gap-2">
        <strong>{{ webhook.description }}</strong>
      </div>

      <p>
        This
        <strong>cannot</strong>
        be undone.
      </p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { useMutation } from '@vue/apollo-composable'
import { LayoutDialog, type LayoutDialogButton } from '@speckle/ui-components'
import type { WebhookItem } from '~~/lib/projects/helpers/types'
import { deleteWebhookMutation } from '~~/lib/projects/graphql/mutations'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage,
  modifyObjectFields
} from '~~/lib/common/helpers/graphql'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import type { WebhookCollection } from '~~/lib/common/generated/gql/graphql'

const props = defineProps<{
  webhook: WebhookItem | null
}>()

const { triggerNotification } = useGlobalToast()
const { mutate: deleteMutation } = useMutation(deleteWebhookMutation)

const isOpen = defineModel<boolean>('open', { required: true })

const deleteConfirmed = async () => {
  const webhookId = props.webhook?.id
  const projectId = props.webhook?.streamId

  if (!webhookId || !projectId) {
    return
  }

  const result = await deleteMutation(
    {
      webhook: {
        id: webhookId,
        streamId: projectId
      }
    },
    {
      update: (cache, { data }) => {
        if (data?.webhookDelete) {
          const cacheId = getCacheId('Webhook', webhookId)
          cache.evict({ id: cacheId })

          const projectCacheId = getCacheId('Project', projectId)
          modifyObjectFields<{ webhooks: WebhookCollection }, WebhookCollection>(
            cache,
            projectCacheId,
            (fieldName, _variables, value) => {
              const oldItems = value?.items || []
              const newItems = oldItems.filter((i) => i?.__ref !== cacheId)
              return {
                ...value,
                items: newItems,
                totalCount: Math.max(0, (value?.totalCount || 0) - 1)
              }
            },
            { fieldNameWhitelist: ['webhooks'] }
          )
        }
      }
    }
  ).catch(convertThrowIntoFetchResult)

  if (result?.data?.webhookDelete) {
    isOpen.value = false
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Webhook deleted',
      description: 'The webhook has been successfully deleted'
    })
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to delete webhook',
      description: errorMessage
    })
  }
}

const dialogButtons: LayoutDialogButton[] = [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => (isOpen.value = false)
  },
  {
    text: 'Delete',
    props: { color: 'danger' },
    onClick: deleteConfirmed
  }
]
</script>
