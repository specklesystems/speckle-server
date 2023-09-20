<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    title="Edit Webhook"
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
          :model-value="(webhookModel.description as string)"
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
          label="Choose Events"
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
import { updateWebhookMutation } from '~~/lib/projects/graphql/mutations'
import { isRequired, isUrl, isItemSelected } from '~~/lib/common/helpers/validation'
import { useForm } from 'vee-validate'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'

const props = defineProps<{
  open: boolean
  webhook: WebhookItem | null
}>()

const { triggerNotification } = useGlobalToast()
const { mutate: updateMutation } = useMutation(updateWebhookMutation)
const { handleSubmit } = useForm<WebhookFormValues>()

const triggers = ref<typeof webhookTriggerItems.value>([])
const isOpen = defineModel<boolean>('open', { required: true })
const webhookModel = ref(props.webhook || { url: '', description: '', triggers: [] })

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

const onSubmit = handleSubmit(async (WebhookFormValues) => {
  const webhookId = props.webhook?.id
  if (!webhookId) {
    return
  }

  const result = await updateMutation(
    {
      webhook: {
        id: webhookId,
        streamId: props.webhook.streamId,
        url: WebhookFormValues.url,
        description: WebhookFormValues.description,
        triggers: WebhookFormValues.triggers.map((i) => {
          return (
            Object.entries(WebhookTriggers).find(([key]) => key === i.id)?.[1] || i.id
          )
        })
      }
    },
    {
      update: (cache, { data }) => {
        if (data?.webhookUpdate) {
          cache.modify({
            id: getCacheId('Webhook', webhookId),
            fields: {
              url: () => webhookModel.value.url,
              description: () => webhookModel.value.description || '',
              triggers: () => triggers.value.map((i) => i.text)
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
})

watch(
  () => props.webhook,
  (newVal) => {
    webhookModel.value = newVal
      ? { ...newVal }
      : { url: '', description: '', triggers: [] }
    triggers.value = (
      (newVal?.triggers || []).filter(
        (t): t is NonNullable<typeof t> => !!t
      ) as string[]
    ).map((i) => {
      const mappedKey = Object.entries(WebhookTriggers).find(
        ([value]) => value === i
      )?.[0]
      return { id: mappedKey || i, text: mappedKey || i }
    })
  },
  { immediate: true }
)

const resetWebhookModel = () => {
  webhookModel.value = props.webhook
    ? { ...props.webhook }
    : { url: '', description: '', triggers: [] }

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

const dialogButtons = [
  {
    text: 'Cancel',
    props: { color: 'secondary', fullWidth: true, outline: true },
    onClick: () => {
      isOpen.value = false
      resetWebhookModel()
    }
  },
  {
    text: 'Save',
    props: { color: 'primary', fullWidth: true },
    onClick: onSubmit
  }
]
</script>
