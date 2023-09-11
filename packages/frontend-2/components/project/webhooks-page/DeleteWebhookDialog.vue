<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    title="Delete Webhook"
    :buttons="dialogButtons"
  >
    <div class="flex flex-col gap-6 text-sm text-foreground">
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
import { LayoutDialog } from '@speckle/ui-components'
import { WebhookItem } from '~~/lib/projects/helpers/types'
import { deleteWebhookMutation } from '~~/lib/projects/graphql/mutations'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import {
  ROOT_QUERY,
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage,
  modifyObjectFields
} from '~~/lib/common/helpers/graphql'
import { WebhookCollection } from '~~/lib/common/generated/gql/graphql'

const props = defineProps<{
  open: boolean
  webhook: WebhookItem | null
}>()

const { triggerNotification } = useGlobalToast()
const { mutate: deleteMutation } = useMutation(deleteWebhookMutation)

const isOpen = defineModel<boolean>('open', { required: true })

const deleteConfirmed = async () => {
  const webhookId = props.webhook?.id
  if (!webhookId) {
    return
  }

  const result = await deleteMutation(
    {
      webhook: {
        id: props.webhook.id,
        streamId: props.webhook.streamId
      }
    },
    {
      update: (cache, { data }) => {
        if (data?.webhookDelete) {
          const cacheId = getCacheId('Webhook', webhookId)
          cache.evict({
            id: cacheId
          })

          modifyObjectFields<undefined, { [key: string]: WebhookCollection }>(
            cache,
            ROOT_QUERY,
            (_fieldName, _variables, value, details) => {
              const webhookCollectionFields = Object.keys(value).filter(
                (k) => details.revolveFieldNameAndVariables(k).fieldName === 'webhooks'
              )
              const newVal: typeof value = { ...value }

              for (const field of webhookCollectionFields) {
                const oldItems = value[field]?.items || []
                const newItems = oldItems.filter((i) => i?.id !== webhookId)
                newVal[field] = {
                  ...value[field],
                  ...(value[field]?.items ? { items: newItems } : {}),
                  totalCount: Math.max(0, (value[field]?.totalCount || 0) - 1)
                }
              }
              return newVal
            }
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

const dialogButtons = [
  {
    text: 'Delete',
    props: { color: 'danger', fullWidth: true },
    onClick: deleteConfirmed
  },
  {
    text: 'Cancel',
    props: { color: 'secondary', fullWidth: true, outline: true },
    onClick: () => (isOpen.value = false)
  }
]
</script>
