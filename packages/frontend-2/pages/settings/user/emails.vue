<template>
  <section>
    <div class="md:max-w-xl md:mx-auto">
      <SettingsSectionHeader
        title="Emails addresses"
        text="Manage your email addresses"
      />
      <SettingsSectionHeader title="Your emails" subheading />
      <SettingsUserEmailList class="pt-6" :email-data="emails" />
      <hr class="my-6 md:my-8 border-outline-2" />
      <SettingsSectionHeader title="Add new email" subheading />
      <div class="flex flex-col md:flex-row w-full pt-4 md:pt-6 pb-6">
        <div class="flex flex-col md:flex-row gap-x-2 w-full">
          <FormTextInput
            v-model="email"
            color="foundation"
            label-position="left"
            label="Email address"
            name="email"
            :rules="[isEmail, isRequired]"
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
import { isEmail, isRequired } from '~~/lib/common/helpers/validation'
import { useForm } from 'vee-validate'
import { useMutation } from '@vue/apollo-composable'
import { settingsCreateUserEmailMutation } from '~/lib/settings/graphql/mutations'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { useMixpanel } from '~/lib/core/composables/mp'
import { useUserEmails } from '~/lib/user/composables/emails'

definePageMeta({
  layout: 'settings'
})

useHead({
  title: 'Settings - Emails'
})

type FormValues = { email: string }

const { handleSubmit } = useForm<FormValues>()
const { emails } = useUserEmails()
const { mutate: createMutation } = useMutation(settingsCreateUserEmailMutation)
const mixpanel = useMixpanel()

const email = ref('')

const onAddEmailSubmit = handleSubmit(async () => {
  const result = await createMutation({ input: { email: email.value } }).catch(
    convertThrowIntoFetchResult
  )
  if (result?.data) {
    email.value = ''
    mixpanel.track('Email Added')
  }
})
</script>
