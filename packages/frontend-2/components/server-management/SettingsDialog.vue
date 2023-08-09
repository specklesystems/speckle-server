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
        :error-message="(form.errors.value as FormErrors).name"
      />
      <FormTextArea
        v-model="form.values.description"
        label="Description"
        name="description"
        placeholder="Description"
        show-label
        :error-message="(form.errors.value as FormErrors).description"
      />
      <FormTextInput
        v-model="form.values.adminContact"
        label="Admin Email"
        name="adminEmail"
        placeholder="Admin Email"
        show-label
        :type="'email'"
        :error-message="(form.errors.value as FormErrors).adminContact"
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

import { LayoutDialog, FormTextInput, FormTextArea } from '@speckle/ui-components'

const logger = useLogger() as { error: (...args: unknown[]) => void }

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
    adminContact: { required: true, min: 3, max: 50 }
  },
  initialValues: {
    name: '',
    description: '',
    adminContact: ''
  }
})

// Define the GraphQL queries and mutations
const serverInfoQuery = gql`
  query ServerStatistics {
    serverInfo {
      name
      description
      adminContact
    }
  }
`

const updateServerInfoMutation = gql`
  mutation UpdateServerInfo($input: UpdateServerInfoInput!) {
    updateServerInfo(input: $input) {
      serverInfo {
        name
        description
        adminContact
      }
    }
  }
`

// Use the useQuery and useMutation hooks
const { onResult } = useQuery<ServerInfoResponse>(serverInfoQuery)
const { mutate } = useMutation(updateServerInfoMutation)

// Use the onResult function to update the form values when the query is successful
onResult((response) => {
  const serverInfo = response.data?.serverInfo
  if (serverInfo) {
    form.setValues({
      name: serverInfo.name,
      description: serverInfo.description,
      adminContact: serverInfo.adminContact
    })
  }
})

// Update the onSave function to validate the form before submitting
const onSave = async () => {
  try {
    // Validate the form
    const { errors } = await form.validate()

    // If there are no errors, submit the form
    if (!Object.keys(errors).length) {
      await mutate({ variables: { input: form.values } })
    }
  } catch (error) {
    logger.error('Error updating server info:', error)
  }
}

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
const title = 'Edit Server Information'
</script>

<style scoped>
/* Add any scoped styles here */
</style>
