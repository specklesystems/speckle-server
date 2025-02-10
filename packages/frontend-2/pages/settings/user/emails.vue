<template>
  <section>
    <div class="md:max-w-xl md:mx-auto">
      <SettingsSectionHeader
        title="Emails addresses"
        text="Manage your email addresses"
      />
      <SettingsSectionHeader title="Your emails" subheading />
      <SettingsUserEmailList />
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
import { useForm } from 'vee-validate'
import { isEmail, isRequired } from '~~/lib/common/helpers/validation'
import { useUserEmails } from '~/lib/user/composables/emails'

definePageMeta({
  layout: 'settings'
})

useHead({
  title: 'Settings - Emails'
})

type FormValues = { email: string }

const { handleSubmit } = useForm<FormValues>()
const { addUserEmail } = useUserEmails()
const email = ref('')

const onAddEmailSubmit = handleSubmit(async () => {
  const success = await addUserEmail(email.value)
  if (success) {
    email.value = ''
  }
})
</script>
