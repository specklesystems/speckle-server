<template>
  <section>
    <div class="md:max-w-xl md:mx-auto">
      <SettingsSectionHeader
        title="Emails addresses"
        text="Manage your email addresses"
      />
      <SettingsSectionHeader title="Your emails" subheading />
      <SettingsUserEmailList class="pt-6" :email-data="emailItems" />
      <hr class="my-6 md:my-10" />
      <SettingsSectionHeader title="Add new email" subheading />
      <div class="flex flex-col md:flex-row w-full pt-4 md:pt-6 pb-6">
        <div class="flex flex-col md:flex-row gap-x-2 w-full">
          <FormTextInput
            v-model="email"
            color="foundation"
            label-position="left"
            label="Email address"
            name="email"
            :rules="isEmail"
            placeholder="Email address"
            show-label
            wrapper-classes="flex-1 py-3 md:py-0 w-full"
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
import { isEmail } from '~~/lib/common/helpers/validation'
import { useForm } from 'vee-validate'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { settingsUserEmailsQuery } from '~/lib/settings/graphql/queries'
import { settingsCreateUserEmailMutation } from '~/lib/settings/graphql/mutations'
import {
  getFirstErrorMessage,
  convertThrowIntoFetchResult
} from '~~/lib/common/helpers/graphql'

type FormValues = { email: string }

const { handleSubmit } = useForm<FormValues>()
const { triggerNotification } = useGlobalToast()
const { result: userEmailsResult } = useQuery(settingsUserEmailsQuery)
const { mutate: createMutation } = useMutation(settingsCreateUserEmailMutation)

const email = ref('')

// Mak sure primary email is always on top, followed by verified emails
const emailItems = computed(() =>
  userEmailsResult.value?.activeUser?.emails
    ? orderBy(
        userEmailsResult.value?.activeUser.emails,
        ['primary', 'verified'],
        ['desc', 'desc']
      )
    : []
)

const onAddEmailSubmit = handleSubmit(async () => {
  const result = await createMutation({ input: { email: email.value } }).catch(
    convertThrowIntoFetchResult
  )
  if (result?.data) {
    triggerNotification({
      type: ToastNotificationType.Success,
      title: `${email.value} added`
    })

    email.value = ''
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: errorMessage
    })
  }
})
</script>
