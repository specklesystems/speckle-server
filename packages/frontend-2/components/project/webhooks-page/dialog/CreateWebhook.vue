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
        />
      </div>
    </form>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { isRequired } from '~~/lib/common/helpers/validation'
import { WebhookTriggers } from '@speckle/shared/'
import {
  LayoutDialog,
  FormTextInput,
  FormSelectMultiBadge
} from '@speckle/ui-components'

const props = defineProps<{
  open: boolean
  name: string
  url: string
  secret: string
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'server-info-updated'): void
}>()

const name = toRef(props, 'name')
const url = toRef(props, 'url')
const secret = toRef(props, 'secret')

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

const webhookTriggerItems = computed(() => {
  return Object.entries(WebhookTriggers as Record<string, unknown>).map(
    ([value, key]) => ({
      id: value,
      value,
      text: key
    })
  )
})

const dialogButtons = computed(() => [
  {
    text: 'Cancel',
    props: { color: 'secondary', fullWidth: true, outline: true },
    onClick: () => (isOpen.value = false)
  },
  {
    text: 'Create',
    props: { color: 'primary', fullWidth: true, outline: false },
    onClick: () => (isOpen.value = false)
  }
])

const requiredRule = [isRequired]
</script>
