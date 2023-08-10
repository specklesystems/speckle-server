<template>
  <LayoutDialog v-model:open="isOpen" max-width="sm" :title="title" :buttons="buttons">
    <div class="flex flex-col gap-6">
      <FormTextInput
        v-model="form.values.name"
        label="This server’s public name"
        name="serverName"
        placeholder="Server name"
        show-label
        :show-required="true"
        :type="'text'"
        :error-message="((form.errors.value as any) as FormErrors).name"
      />
      <FormTextArea
        v-model="form.values.description"
        label="Description"
        name="description"
        placeholder="Description"
        show-label
        :error-message="((form.errors.value as any) as FormErrors).description"
      />
      <FormTextInput
        v-model="form.values.company"
        label="Owner"
        name="owner"
        placeholder="Owner"
        show-label
        :error-message="((form.errors.value as any) as FormErrors).company"
      />
      <FormTextInput
        v-model="form.values.adminContact"
        label="Admin Email"
        name="adminEmail"
        placeholder="Admin Email"
        show-label
        :type="'email'"
        :error-message="((form.errors.value as any) as FormErrors).adminContact"
      />
      <FormTextInput
        v-model="form.values.termsOfService"
        label="Url pointing to the terms of service page"
        name="terms"
        show-label
        :error-message="((form.errors.value as any) as FormErrors).termsOfService"
      />
      <FormCheckbox
        v-model="form.values.inviteOnly"
        label="Invite only mode - Only users with an invitation will be able to join"
        name="inviteOnly"
        show-label
        :error-message="((form.errors.value as any) as FormErrors).inviteOnly"
      />
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { computed, defineEmits, defineProps } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { gql } from '@apollo/client/core'
import { useForm, defineRule } from 'vee-validate'
import { useLogger } from '~~/composables/logging'
import {
  Button,
  ServerInfoResponse,
  FormErrors
} from '../../lib/server-management/helpers/types'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { LayoutDialog, FormTextInput, FormTextArea } from '@speckle/ui-components'

const logger = useLogger() as { error: (...args: unknown[]) => void }
const { triggerNotification } = useGlobalToast()

// Define the rules
defineRule('required', (value: string) => !!value || 'This field is required.')
defineRule(
  'min',
  (value: string, [length]: [number]) =>
    value.length >= length || `This field should have at least ${length} characters.`
)
defineRule(
  'max',
  (value: string, [length]: [number]) =>
    value.length <= length || `This field should not exceed ${length} characters.`
)

// Create the form
const form = useForm({
  validationSchema: {
    name: { required: true, min: 3, max: 50 },
    description: { min: 3, max: 300 },
    adminContact: { required: true, min: 3, max: 50 },
    company: { required: true, min: 3, max: 50 },
    termsOfService: { required: true, min: 3, max: 50 }
  },
  initialValues: {
    name: '',
    description: '',
    adminContact: '',
    company: '',
    termsOfService: '',
    inviteOnly: true
  }
})

// Define the GraphQL queries and mutations
const serverInfoQuery = gql`
  query ServerSettingsDialogData {
    serverInfo {
      name
      description
      adminContact
      company
      termsOfService
      inviteOnly
    }
  }
`

const serverInfoUpdateMutation = gql`
  mutation ServerInfoUpdate($info: ServerInfoUpdateInput!) {
    serverInfoUpdate(info: $info)
  }
`

const { onResult } = useQuery<ServerInfoResponse>(serverInfoQuery)
const { mutate } = useMutation(serverInfoUpdateMutation)

// Use the onResult function to update the form values when the query is successful
onResult((response) => {
  const serverInfo = response.data?.serverInfo
  if (serverInfo) {
    form.setValues({
      name: serverInfo.name,
      description: serverInfo.description,
      adminContact: serverInfo.adminContact,
      company: serverInfo.company || '',
      termsOfService: serverInfo.termsOfService || '',
      inviteOnly: serverInfo.inviteOnly
    })
  }
})

// Update the onSave function to validate the form before submitting
const onSave = async () => {
  // Validate the form
  const { errors } = await form.validate()

  // If there are no errors, try to submit the form
  if (!Object.keys(errors).length) {
    try {
      const plainObject = {
        name: form.values.name,
        description: form.values.description,
        adminContact: form.values.adminContact,
        company: form.values.company,
        termsOfService: form.values.termsOfService,
        inviteOnly: form.values.inviteOnly,
        guestModeEnabled: false // You might want to add this as a field in your form
      }

      await mutate({ variables: { info: plainObject } })

      // Trigger a success toast when the mutation is successful
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Success',
        description: 'Server settings have been successfully updated.'
      })
    } catch (error) {
      // Trigger a danger toast when there is an error
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Error',
        description: 'There was an error updating the server settings.'
      })
      logger.error('Error updating server info:', error)
    }
  }
}

// Expose onSave
defineExpose({ onSave })

// Define the props and emits for the component
const props = defineProps<{
  open: boolean
  buttons: Array<Button>
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()

// Compute the isOpen state
const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

// Define the title
const title = 'Edit Server Settings'
</script>

<style scoped>
/* Add any scoped styles here */
</style>
