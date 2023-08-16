<template>
  <LayoutDialog v-model:open="isOpen" max-width="sm" :title="title" :buttons="buttons">
    <form @submit="onSubmit">
      <div class="flex flex-col gap-6">
        <FormTextInput
          v-model="name"
          label="This server’s public name"
          name="serverName"
          placeholder="Server name"
          show-label
          :show-required="true"
          :rules="requiredRule"
          :type="'text'"
        />
        <FormTextArea
          v-model="description"
          label="Description"
          name="description"
          placeholder="Description"
          show-label
        />
        <FormTextInput
          v-model="company"
          label="Owner"
          name="owner"
          placeholder="Owner"
          show-label
        />
        <FormTextInput
          v-model="adminContact"
          label="Admin Email"
          name="adminEmail"
          placeholder="Admin Email"
          show-label
          :rules="emailRules"
          :type="'email'"
        />
        <FormTextInput
          v-model="termsOfService"
          label="Url pointing to the terms of service page"
          name="terms"
          show-label
        />
        <FormCheckbox
          v-model="inviteOnly"
          label="Invite only mode - Only users with an invitation will be able to join"
          name="inviteOnly"
          show-label
        />
      </div>
    </form>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { useQuery, useMutation } from '@vue/apollo-composable'
import { useForm } from 'vee-validate'
import { isEmail, isRequired } from '~~/lib/common/helpers/validation'
import { graphql } from '~~/lib/common/generated/gql'
import { Button } from '~~/lib/server-management/helpers/types'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import { LayoutDialog, FormTextInput, FormTextArea } from '@speckle/ui-components'
import { useLogger } from '~~/composables/logging'

type FormValues = {
  name: string
  description: string
  company: string
  adminContact: string
  termsOfService: string
  inviteOnly: boolean
}

const serverInfoQuery = graphql(`
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
`)

const serverInfoUpdateMutation = graphql(`
  mutation ServerInfoUpdate($info: ServerInfoUpdateInput!) {
    serverInfoUpdate(info: $info)
  }
`)

const props = defineProps<{
  open: boolean
  buttons: Array<Button>
  title: string
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'server-info-updated'): void
}>()

const logger = useLogger()

const { triggerNotification } = useGlobalToast()

const { handleSubmit } = useForm<FormValues>()

const { result } = useQuery(serverInfoQuery)
const { mutate: updateServerInfo } = useMutation(serverInfoUpdateMutation)

const name = ref('')
const description = ref('')
const company = ref('')
const adminContact = ref('')
const termsOfService = ref('')
const inviteOnly = ref(false)

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

const emailRules = [isEmail]
const requiredRule = [isRequired]

const onSubmit = handleSubmit(async () => {
  try {
    await updateServerInfo({
      info: {
        name: name.value,
        description: description.value,
        company: company.value,
        adminContact: adminContact.value,
        termsOfService: termsOfService.value,
        inviteOnly: inviteOnly.value
      }
    })
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Successfully saved',
      description: 'Your server settings have been saved.'
    })
    isOpen.value = false
    emit('server-info-updated')
  } catch (error) {
    logger.error(error)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Saving failed',
      description: `Failed to update server info`
    })
  }
})

watch(isOpen, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    if (result.value && result.value.serverInfo) {
      name.value = result.value.serverInfo.name
      description.value = result.value.serverInfo.description || ''
      company.value = result.value.serverInfo.company || ''
      adminContact.value = result.value.serverInfo.adminContact || ''
      termsOfService.value = result.value.serverInfo.termsOfService || ''
      inviteOnly.value = result.value.serverInfo.inviteOnly || false
    }
  }
})

defineExpose({
  onSubmit
})
</script>
