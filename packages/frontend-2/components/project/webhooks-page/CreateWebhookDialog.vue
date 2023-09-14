<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    title="Create Webhook"
    :buttons="dialogButtons"
    prevent-close-on-click-outside
  >
    <form @submit="onSubmit">
      <div class="flex flex-col gap-6">
        <FormTextInput
          v-model="url"
          label="URL"
          help="A POST request will be sent to this URL when this webhook is triggered"
          name="hookUrl"
          show-label
          show-required
          :rules="requiredRule"
          type="text"
        />
        <FormTextInput
          v-model="name"
          label="Webhook name"
          help="An optional name to help you identify this webhook"
          name="hookName"
          show-label
          type="text"
        />
        <FormTextInput
          v-model="secret"
          label="Secret"
          help="An optional secret. You'll be able to change this in the future, but you won't be able to retrieve it."
          name="hookSecret"
          show-label
          type="text"
        />
        <FormSelectMultiBadge
          name="Name"
          label="Choose Events"
          show-required
          :rules="requiredRule"
          show-label
          :items="webhookTriggerItems"
          @update:model-value="updateTriggers"
        />
      </div>
    </form>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { useMutation } from '@vue/apollo-composable'
import { WebhookTriggers } from '@speckle/shared/src/core/constants'
import {
  LayoutDialog,
  FormTextInput,
  FormSelectMultiBadge,
  ToastNotificationType
} from '@speckle/ui-components'
import { isRequired } from '~~/lib/common/helpers/validation'
import { createWebhookMutation } from '~~/lib/projects/graphql/mutations'
import { WebhookCreateInput } from '~~/lib/common/generated/gql/graphql'
import { useGlobalToast } from '~~/lib/common/composables/toast'

const requiredRule = [isRequired]

const props = defineProps<{
  open: boolean
  streamId: string
  webhookId?: string
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'webhook-created'): void
}>()

const { triggerNotification } = useGlobalToast()
const { mutate: createWebhook } = useMutation(createWebhookMutation)

const name = ref('')
const url = ref('')
const secret = ref('')
const triggers = ref<string[]>([])

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

const webhookTriggerItems = computed(() => {
  return Object.entries(WebhookTriggers as Record<string, unknown>).map(
    ([value, key]) => ({
      id: value,
      text: key
    })
  )
})

const onSubmit = async () => {
  try {
    const webhookInput: WebhookCreateInput = {
      description: name.value,
      secret: secret.value,
      url: url.value,
      streamId: props.streamId,
      triggers: triggers.value,
      enabled: true
    }

    await createWebhook({ webhook: webhookInput })
    emit('webhook-created')
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Webhook succesfully created'
    })
    isOpen.value = false
  } catch (error) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Problem creating webhook'
    })
    console.error('Error creating webhook:', error)
  }
}

const updateTriggers = (newValue: { text: string }[]) => {
  triggers.value = newValue.map((item) => item.text)
}

const dialogButtons = [
  {
    text: 'Cancel',
    props: { color: 'secondary', fullWidth: true, outline: true },
    onClick: () => (isOpen.value = false)
  },
  {
    text: 'Create',
    props: { color: 'primary', fullWidth: true, outline: false },
    onClick: onSubmit
  }
]
</script>
