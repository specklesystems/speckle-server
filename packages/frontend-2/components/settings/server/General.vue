<template>
  <section>
    <div class="md:max-w-xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader title="General" text="Manage your server settings" />
      <div class="flex flex-col space-y-6">
        <SettingsSectionHeader title="Server details" subheading />
        <form class="flex flex-col gap-2" @submit="onSubmit">
          <div class="flex flex-col gap-4">
            <FormTextInput
              v-model="name"
              label="Server public name"
              name="serverName"
              color="foundation"
              placeholder="Server name"
              show-label
              label-position="left"
              :rules="requiredRule"
              type="text"
            />
            <hr class="border-outline-3" />
            <FormTextInput
              v-model="description"
              color="foundation"
              label="Description"
              name="description"
              placeholder="Description"
              show-label
              label-position="left"
            />
            <hr class="border-outline-3" />
            <FormTextInput
              v-model="company"
              color="foundation"
              label="Owner"
              name="owner"
              placeholder="Owner"
              show-label
              label-position="left"
            />
            <hr class="border-outline-3" />
            <FormTextInput
              v-model="adminContact"
              color="foundation"
              label="Admin email"
              name="adminEmail"
              placeholder="Admin email"
              show-label
              type="email"
              label-position="left"
            />
            <hr class="border-outline-3" />
            <FormTextInput
              v-model="termsOfService"
              color="foundation"
              label="URL to the Terms of Service"
              name="terms"
              show-label
              label-position="left"
            />
            <hr class="border-outline-3" />
            <FormCheckbox
              v-model="inviteOnly"
              label="Invite only mode"
              description="Only users with an invitation will be able to join the server"
              label-position="left"
              name="inviteOnly"
              show-label
            />
            <hr class="border-outline-3" />
            <FormCheckbox
              v-model="guestModeEnabled"
              label="Guest mode"
              description="Enables the 'Guest' server role, which allows users to only contribute to projects that they're invited to"
              label-position="left"
              name="guestModeEnabled"
              show-label
            />
            <div class="mt-6">
              <FormButton color="primary" @click="onSubmit">Save changes</FormButton>
            </div>
          </div>
        </form>
      </div>
      <hr class="my-6 md:my-8 border-outline-2" />
      <SettingsServerGeneralVersion />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useQuery, useMutation } from '@vue/apollo-composable'
import { useForm } from 'vee-validate'
import { isRequired } from '~~/lib/common/helpers/validation'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import { FormTextInput, useFormCheckboxModel } from '@speckle/ui-components'
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
  } else {
    logger.error(result && result.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Saving failed',
      description: 'Failed to update server info'
    })
  }
})

onBeforeMount(() => {
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
