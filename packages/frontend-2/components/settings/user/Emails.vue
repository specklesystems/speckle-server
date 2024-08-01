<template>
  <section>
    <div class="md:max-w-xl md:mx-auto">
      <SettingsSectionHeader title="Emails" text="Manage email addresses" />
      <SettingsSectionHeader title="Your emails" subheading />
      <SettingsUserEmailCards
        class="pt-6"
        :email-data="emailItems"
        @delete="onDeleteEmail"
        @set-primary="onSetPrimary"
      />
      <hr class="my-6 md:my-10" />
      <SettingsSectionHeader title="Add new email" subheading />
      <div class="flex flex-col md:flex-row gap-x-4 w-full justify-center pt-6">
        <div class="w-1/2 flex items-center">
          <span class="text-body-xs font-medium">New email address</span>
        </div>
        <div class="flex flex-col md:flex-row gap-x-2 md:w-1/2">
          <FormTextInput
            v-model="email"
            color="foundation"
            label="email"
            name="email"
            :rules="emailRules"
            placeholder="Email address"
            wrapper-classes="flex-1 py-3 md:py-0"
          />
          <FormButton @click="onAddEmailSubmit">Add</FormButton>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { orderBy } from 'lodash-es'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { isEmail, isRequired } from '~~/lib/common/helpers/validation'
import { useForm } from 'vee-validate'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { settingsUserEmailsQuery } from '~/lib/settings/graphql/queries'
import {
  settingsCreateUserEmailMutation,
  settingsDeleteUserEmailMutation,
  settingsSetPrimaryUserEmailMutation
} from '~/lib/settings/graphql/mutations'
import { getFirstErrorMessage } from '~~/lib/common/helpers/graphql'

type FormValues = { email: string }

const { handleSubmit } = useForm<FormValues>()
const { triggerNotification } = useGlobalToast()
const { result: userEmailsResult } = useQuery(settingsUserEmailsQuery)
const { mutate: createMutation } = useMutation(settingsCreateUserEmailMutation, {
  refetchQueries: [{ query: settingsUserEmailsQuery }]
})
const { mutate: deleteMutation } = useMutation(settingsDeleteUserEmailMutation, {
  refetchQueries: [{ query: settingsUserEmailsQuery }]
})
const { mutate: updateMutation } = useMutation(settingsSetPrimaryUserEmailMutation, {
  refetchQueries: [{ query: settingsUserEmailsQuery }]
})

const emailRules = [isEmail, isRequired]

const email = ref('')

const emailItems = computed(() =>
  userEmailsResult.value?.userEmails
    ? orderBy(userEmailsResult.value.userEmails, ['primary'], ['desc'])
    : []
)

const onAddEmailSubmit = handleSubmit(async () => {
  const result = await createMutation({ input: { email: email.value } })
  if (result?.data) {
    triggerNotification({
      type: ToastNotificationType.Success,
      title: `${email.value} added`
    })
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: errorMessage
    })
  }
})

const onDeleteEmail = async (id: string, email: string) => {
  const result = await deleteMutation({ input: { id } })
  if (result?.data) {
    triggerNotification({
      type: ToastNotificationType.Success,
      title: `${email} deleted`
    })
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: errorMessage
    })
  }
}

const onSetPrimary = async (id: string, email: string) => {
  const result = await updateMutation({ input: { id } })
  if (result?.data) {
    triggerNotification({
      type: ToastNotificationType.Success,
      title: `Made ${email} primary`
    })
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: errorMessage
    })
  }
}
</script>
