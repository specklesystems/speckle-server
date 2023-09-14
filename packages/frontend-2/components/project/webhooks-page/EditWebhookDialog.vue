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
          :rules="requiredRule"
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

        <FormSelectMultiBadge
          v-model="triggers"
          multiple
          name="triggers"
          label="Choose Events"
          show-required
          :rules="requiredRule"
          show-label
          :items="webhookTriggerItems"
        />
      </div>
    </form>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { useMutation } from '@vue/apollo-composable'
import { LayoutDialog } from '@speckle/ui-components'
import { isRequired } from '~~/lib/common/helpers/validation'
import { WebhookItem } from '~~/lib/projects/helpers/types'
import { updateWebhookMutation } from '~~/lib/projects/graphql/mutations'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { WebhookTriggers } from '@speckle/shared'
import { TableItemType } from '@speckle/ui-components'

const props = defineProps<{
  open: boolean
  webhook: TableItemType<WebhookItem> | null
}>()

const { triggerNotification } = useGlobalToast()
const { mutate: updateMutation } = useMutation(updateWebhookMutation)

const triggers = ref<typeof webhookTriggerItems.value>([])

const isOpen = defineModel<boolean>('open', { required: true })

const webhookTriggerItems = computed(() => {
  return Object.entries(WebhookTriggers as Record<string, unknown>).map(
    ([value, key]) => ({
      id: value,
      text: key
    })
  )
})

const onSubmit = async () => {
  const webhookId = props.webhook?.id
  if (!webhookId) {
    return
  }

  const result = await updateMutation(
    {
      webhook: {
        id: webhookId,
        streamId: props.webhook.streamId,
        url: webhookModel.value.url,
        description: webhookModel.value.description,
        triggers: triggers.value.map((i) => i.id)
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
              triggers: () => triggers.value.map((i) => i.id)
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
}

const webhookModel = ref(props.webhook || { url: '', description: '', triggers: [] })

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
    ).map((i) => ({ id: i, text: i }))
  },
  { immediate: true }
)

const updateUrl = (newValue: string) => {
  webhookModel.value.url = newValue
}

const updateDescription = (newValue: string) => {
  webhookModel.value.description = newValue
}

const dialogButtons = [
  {
    text: 'Cancel',
    props: { color: 'secondary', fullWidth: true, outline: true },
    onClick: () => (isOpen.value = false)
  },
  {
    text: 'Save',
    props: { color: 'primary', fullWidth: true },
    onClick: onSubmit
  }
]

const requiredRule = [isRequired]
</script>
