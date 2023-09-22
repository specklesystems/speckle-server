<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    :title="props.webhook ? 'Edit Webhook' : 'Create Webhook'"
    :buttons="dialogButtons"
    prevent-close-on-click-outside
  >
    <form @submit="onSubmit">
      <div class="flex flex-col gap-6">
        <FormTextInput
          :model-value="webhookModel.url"
          label="URL"
          help="A POST request will be sent to this URL when this webhook is triggered"
          name="hookUrl"
          show-label
          show-required
          :rules="(isRequired, isUrl)"
          type="text"
          @update:model-value="updateUrl"
        />
        <FormTextInput
          :model-value="webhookModel.description"
          label="Webhook name"
          help="An optional name to help you identify this webhook"
          name="hookName"
          show-label
          type="text"
          @update:model-value="updateDescription"
        />
        <FormSelectBadges
          v-model="triggers"
          multiple
          name="triggers"
          label="Events"
          placeholder="Choose Events"
          show-required
          :rules="[isItemSelected]"
          show-label
          :items="webhookTriggerItems"
          by="id"
        />
      </div>
    </form>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { useMutation } from '@vue/apollo-composable'
import { WebhookTriggers } from '@speckle/shared'
import { LayoutDialog, FormSelectBadges } from '@speckle/ui-components'
import { WebhookItem, WebhookFormValues } from '~~/lib/projects/helpers/types'
import {
  createWebhookMutation,
  updateWebhookMutation
} from '~~/lib/projects/graphql/mutations'
import { isRequired, isUrl, isItemSelected } from '~~/lib/common/helpers/validation'
import { useForm } from 'vee-validate'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import { WebhookCreateInput } from '~~/lib/common/generated/gql/graphql'

const props = defineProps<{
  webhook?: WebhookItem | null
  streamId?: string
}>()

const emit = defineEmits<{
  (e: 'webhook-created'): void
}>()

const { mutate: updateMutation } = useMutation(updateWebhookMutation)
const { mutate: createWebhook } = useMutation(createWebhookMutation)
const { triggerNotification } = useGlobalToast()
const { handleSubmit } = useForm<WebhookFormValues>()

const isOpen = defineModel<boolean>('open', { required: true })

const triggers = ref<typeof webhookTriggerItems.value>([])
const webhookModel = ref<{
  url: string
  description: string
  triggers: {
    id: string
    text: string
  }[]
}>({
  url: '',
  description: '',
  triggers: []
})

const webhookTriggerItems = computed(() => {
  return Object.entries(WebhookTriggers as Record<string, unknown>).map(
    ([value, key]) => ({
      id: value,
      text: key
    })
  )
})

const updateUrl = (newValue: string) => {
  webhookModel.value.url = newValue
}

const updateDescription = (newValue: string) => {
  webhookModel.value.description = newValue
}

const onSubmit = handleSubmit(async (webhookFormValues) => {
  if (props.webhook) {
    const webhookId = props.webhook.id

    const result = await updateMutation(
      {
        webhook: {
          id: webhookId,
          streamId: props.webhook.streamId,
          url: webhookModel.value.url,
          description: webhookModel.value.description,
          triggers: webhookFormValues.triggers.map((t) => t.text)
        }
      },
      {
        update: (cache, { data }) => {
          if (data?.webhookUpdate) {
            cache.modify({
              id: getCacheId('Webhook', webhookId),
              fields: {
                url: () => webhookFormValues.url,
                description: () => webhookFormValues.description || '',
                triggers: () => webhookFormValues.triggers.map((t) => t.text)
              }
            })
          }
        }
      }
    ).catch(convertThrowIntoFetchResult)

    if (result?.data?.webhookUpdate) {
      isOpen.value = false
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Webhook updated',
        description: 'The webhook has been successfully updated'
      })
    } else {
      const errorMessage = getFirstErrorMessage(result?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to update webhook',
        description: errorMessage
      })
    }
  } else {
    const webhookInput: WebhookCreateInput = {
      description: webhookModel.value.description,
      url: webhookModel.value.url,
      streamId: props.streamId || '',
      triggers: webhookFormValues.triggers.map((t) => t.text),
      enabled: true
    }

    createWebhook({ webhook: webhookInput })
      .then(() => {
        emit('webhook-created')
        triggerNotification({
          type: ToastNotificationType.Success,
          title: 'Webhook successfully created'
        })
        isOpen.value = false
      })
      .catch(convertThrowIntoFetchResult)
      .then((result) => {
        if (result?.errors) {
          const errorMessage = getFirstErrorMessage(result.errors)
          triggerNotification({
            type: ToastNotificationType.Danger,
            title: 'Problem creating webhook',
            description: errorMessage
          })
          console.error('Error creating webhook:', errorMessage)
        }
      })
  }
})

watch(
  () => props.webhook,
  (newVal) => {
    webhookModel.value = newVal
      ? {
          url: newVal.url,
          description: newVal.description || '',
          triggers:
            newVal.triggers?.map((trigger) => ({
              id: trigger,
              text:
                Object.entries(WebhookTriggers).find(
                  ([value]) => value === trigger
                )?.[1] || trigger
            })) || []
        }
      : { url: '', description: '', triggers: [] }

    triggers.value = (newVal?.triggers || []).map((trigger) => {
      const mappedKey = Object.entries(WebhookTriggers).find(
        ([value]) => value === trigger
      )?.[0]
      return {
        id: mappedKey || trigger,
        text: mappedKey || trigger
      }
    })
  },
  { immediate: true }
)

const resetWebhookModel = () => {
  webhookModel.value = { url: '', description: '', triggers: [] }

  triggers.value = (props.webhook?.triggers || []).map((i) => {
    const mappedKey = Object.entries(WebhookTriggers).find(
      ([value]) => value === i
    )?.[0]
    return {
      id: mappedKey || i || 'unknown_id',
      text: mappedKey || i || 'unknown_text'
    }
  })
}

const dialogButtons = computed(() => [
  {
    text: 'Cancel',
    props: { color: 'secondary', fullWidth: true, outline: true },
    onClick: () => {
      isOpen.value = false
      resetWebhookModel()
    }
  },
  {
    text: props.webhook ? 'Save' : 'Create',
    props: { color: 'primary', fullWidth: true },
    onClick: onSubmit
  }
])
</script>
