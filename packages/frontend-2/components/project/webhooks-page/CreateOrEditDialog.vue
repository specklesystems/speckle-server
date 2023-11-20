<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    :buttons="dialogButtons"
    prevent-close-on-click-outside
  >
    <template #header>
      {{ props.webhook ? 'Edit Webhook' : 'Create Webhook' }}
    </template>
    <form @submit="onSubmit">
      <div class="flex flex-col gap-6">
        <FormTextInput
          v-model="url"
          label="URL"
          help="A POST request will be sent to this URL when this webhook is triggered"
          name="hookUrl"
          show-label
          show-required
          :rules="[isRequired, isUrl]"
          type="text"
        />
        <FormTextInput
          v-model="description"
          label="Webhook name"
          help="An optional name to help you identify this webhook"
          name="hookName"
          show-label
          type="text"
        />
        <FormTextInput
          v-if="!props.webhook"
          v-model="secret"
          label="Secret"
          help="An optional secret. You'll be able to change this in the future, but you won't be able to retrieve it."
          name="hookSecret"
          show-label
          type="text"
        />
        <FormSelectBadges
          v-model="triggers"
          multiple
          name="triggers"
          label="Events"
          placeholder="Choose Events"
          mount-menu-on-body
          help="Choose what events will trigger this webhook."
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
import {
  isRequired,
  isUrl,
  isItemSelected,
  fullyResetForm
} from '~~/lib/common/helpers/validation'
import { useForm } from 'vee-validate'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import { ValueOf } from 'type-fest'

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
const { handleSubmit, resetForm } = useForm<WebhookFormValues>()

const isOpen = defineModel<boolean>('open', { required: true })

const triggers = ref<typeof webhookTriggerItems.value>([])
const url = ref('')
const description = ref('')
const secret = ref('')

const webhookTriggerItems = computed(() => {
  return Object.values(WebhookTriggers).map((value) => ({
    id: value,
    text: value
  }))
})

const onSubmit = handleSubmit(async (webhookFormValues) => {
  if (props.webhook) {
    const webhookId = props.webhook.id
    const result = await updateMutation(
      {
        webhook: {
          id: webhookId,
          streamId: props.webhook.streamId,
          url: url.value,
          description: description.value,
          secret: secret.value?.length ? secret.value : null,
          triggers: webhookFormValues.triggers.map((t) => t.id)
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
                triggers: () => webhookFormValues.triggers.map((t) => t.id)
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
    const result = await createWebhook({
      webhook: {
        description: description.value,
        url: url.value,
        secret: secret.value?.length ? secret.value : null,
        streamId: props.streamId || '',
        triggers: webhookFormValues.triggers.map((t) => t.id),
        enabled: true
      }
    }).catch(convertThrowIntoFetchResult)

    if (result?.data?.webhookCreate) {
      isOpen.value = false
      emit('webhook-created')
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Webhook created',
        description: 'The webhook has been successfully created'
      })
    } else {
      const errorMessage = getFirstErrorMessage(result?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to create webhook',
        description: errorMessage
      })
    }
  }
})

watch(
  () => isOpen.value,
  (newVal, oldVal) => {
    if (!(newVal && !oldVal)) return

    // Only run on open
    // Reset vee-validate form initialValues to prevent inheriting previous dialog values
    fullyResetForm(resetForm)

    // Explicitly reset values
    resetWebhookModel()
  }
)

const resetWebhookModel = () => {
  url.value = props.webhook?.url || ''
  description.value = props.webhook?.description || ''
  secret.value = ''

  triggers.value = (
    (props.webhook?.triggers || []) as Array<ValueOf<typeof WebhookTriggers>>
  ).map((i) => ({
    id: i,
    text: i
  }))
}

const dialogButtons = computed(() => [
  {
    text: 'Cancel',
    props: { color: 'secondary', fullWidth: true, outline: true },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: props.webhook ? 'Save' : 'Create',
    props: { color: 'primary', fullWidth: true },
    onClick: onSubmit
  }
])
</script>
