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
          v-model="formData.url"
          label="URL"
          help="A POST request will be sent to this URL when this webhook is triggered"
          name="hookUrl"
          show-label
          show-required
          :rules="[isRequired, isUrl]"
          type="text"
        />
        <FormTextInput
          v-model="formData.description"
          label="Webhook name"
          help="An optional name to help you identify this webhook"
          name="hookName"
          show-label
          type="text"
        />
        <FormTextInput
          v-model="formData.secret"
          label="Secret"
          help="An optional secret. You'll be able to change this in the future, but you won't be able to retrieve it."
          name="hookSecret"
          show-label
          type="text"
        />
        <FormSelectBadges
          v-model="formData.triggers"
          multiple
          name="Name"
          label="Choose Events"
          show-required
          :rules="[isItemSelected]"
          show-label
          :items="webhookTriggerItems"
          help="Choose what events will trigger this webhook."
          by="id"
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
  FormSelectBadges,
  ToastNotificationType
} from '@speckle/ui-components'
import { useForm } from 'vee-validate'
import { isRequired, isUrl, isItemSelected } from '~~/lib/common/helpers/validation'
import { createWebhookMutation } from '~~/lib/projects/graphql/mutations'
import { WebhookCreateInput } from '~~/lib/common/generated/gql/graphql'
import { useGlobalToast } from '~~/lib/common/composables/toast'
import { WebhookFormValues } from '~~/lib/projects/helpers/types'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'

const props = defineProps<{
  streamId: string
}>()

const emit = defineEmits<{
  (e: 'webhook-created'): void
}>()

const { handleSubmit } = useForm<WebhookFormValues>()
const { triggerNotification } = useGlobalToast()
const { mutate: createWebhook } = useMutation(createWebhookMutation)

const formData = ref<WebhookFormValues>({
  url: '',
  description: '',
  secret: '',
  triggers: []
})

const isOpen = defineModel<boolean>('open', { required: true })

watch(isOpen, (newVal) => {
  if (!newVal) {
    resetFormData()
  }
})

const webhookTriggerItems = computed(() => {
  return Object.entries(WebhookTriggers).map(([value, key]) => ({
    id: value,
    text: key
  }))
})

const onSubmit = handleSubmit(() => {
  const webhookInput: WebhookCreateInput = {
    description: formData.value.description,
    secret: formData.value.secret,
    url: formData.value.url,
    streamId: props.streamId,
    triggers: formData.value.triggers.map((i) => i.text),
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
})

const resetFormData = () => {
  formData.value = {
    url: '',
    description: '',
    secret: '',
    triggers: []
  }
}

const dialogButtons = [
  {
    text: 'Cancel',
    props: { color: 'secondary', fullWidth: true, outline: true },
    onClick: () => {
      isOpen.value = false
      resetFormData()
    }
  },
  {
    text: 'Create',
    props: { color: 'primary', fullWidth: true, outline: false },
    onClick: onSubmit
  }
]
</script>
