<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    title="Edit Settings"
    :buttons="dialogButtons"
  >
    <form @submit="onSubmit">
      <div class="flex flex-col gap-6">
        <FormTextInput
          v-model="name"
          label="This server's public name"
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
        <FormCheckbox
          v-model="guestModeEnabled"
          label="Guest mode - Enables the 'Guest' server role, which allows users to only contribute to projects that they're invited to"
          name="guestModeEnabled"
          show-label
        />
      </div>
    </form>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { useQuery, useMutation } from '@vue/apollo-composable'
import { useForm } from 'vee-validate'
import { isRequired } from '~~/lib/common/helpers/validation'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import {
  LayoutDialog,
  FormTextInput,
  FormTextArea,
  useFormCheckboxModel
} from '@speckle/ui-components'
import { useLogger } from '~~/composables/logging'
import {
  ROOT_QUERY,
  convertThrowIntoFetchResult,
  modifyObjectFields
} from '~~/lib/common/helpers/graphql'
import { serverInfoQuery } from '~~/lib/server-management/graphql/queries'
import { serverInfoUpdateMutation } from '~~/lib/server-management/graphql/mutations'
import type {
  ServerInfoUpdateMutationVariables,
  Query
} from '~~/lib/common/generated/gql/graphql'

type FormValues = {
  name: string
  description: string
  company: string
  adminContact: string
  termsOfService: string
  inviteOnly: boolean
  guestModeEnabled: boolean
}

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
const { model: inviteOnly, isChecked: isInviteOnlyChecked } = useFormCheckboxModel()
const { model: guestModeEnabled, isChecked: isGuestModeChecked } =
  useFormCheckboxModel()

const isOpen = defineModel<boolean>('open', { required: true })

const dialogButtons = computed(() => [
  {
    text: 'Cancel',
    props: { color: 'secondary', fullWidth: true, outline: true },
    onClick: () => (isOpen.value = false)
  },
  {
    text: 'Save',
    props: { color: 'primary', fullWidth: true, outline: false },
    onClick: onSubmit
  }
])

const requiredRule = [isRequired]

const updateServerInfoAndCache = async (
  variables: ServerInfoUpdateMutationVariables
) => {
  try {
    const result = await updateServerInfo(variables, {
      update: (cache, result) => {
        if (result?.data?.serverInfoUpdate) {
          // Modify 'serverInfo' field of ROOT_QUERY
          modifyObjectFields<undefined, Query['serverInfo']>(
            cache,
            ROOT_QUERY,
            (_fieldName, _variables, value) => {
              const newData = variables.info
              return {
                ...value,
                ...newData,
                guestModeEnabled: newData.guestModeEnabled ?? value.guestModeEnabled
              }
            },
            { fieldNameWhitelist: ['serverInfo'] }
          )
        }
      }
    })
    return result
  } catch (error) {
    return convertThrowIntoFetchResult(error)
  }
}

const onSubmit = handleSubmit(async () => {
  const result = await updateServerInfoAndCache({
    info: {
      name: name.value,
      description: description.value,
      company: company.value,
      adminContact: adminContact.value,
      termsOfService: termsOfService.value,
      inviteOnly: isInviteOnlyChecked.value,
      guestModeEnabled: isGuestModeChecked.value
    }
  })

  if (result && result.data) {
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Successfully saved',
      description: 'Your server settings have been saved.'
    })
    isOpen.value = false
  } else {
    logger.error(result && result.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Saving failed',
      description: `Failed to update server info`
    })
  }
})

watch(isOpen, (newVal, oldVal) => {
  if (!newVal || oldVal) return
  if (!result.value?.serverInfo) return

  name.value = result.value.serverInfo.name
  description.value = result.value.serverInfo.description || ''
  company.value = result.value.serverInfo.company || ''
  adminContact.value = result.value.serverInfo.adminContact || ''
  termsOfService.value = result.value.serverInfo.termsOfService || ''
  isInviteOnlyChecked.value = !!result.value.serverInfo.inviteOnly
  isGuestModeChecked.value = !!result.value.serverInfo.guestModeEnabled
})
</script>
