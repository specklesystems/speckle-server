<template>
  <div class="md:max-w-xl md:mx-auto">
    <SettingsSectionHeader title="Emails" text="Manage email addresses" />
    <SettingsSectionHeader title="Your emails" subheading />
    <SettingsUserEmailCards
      class="pt-6"
      :email-data="dummyData"
      @deleted="onDelete"
      @make-primary="onMakePrimary"
    />
    <hr class="my-6 md:my-10" />
    <SettingsSectionHeader title="Add new email" subheading />
    <div class="flex flex-col md:flex-row gap-x-4 w-full justify-center pt-6">
      <div class="w-1/2">
        <span class="text-sm font-semibold">New email address</span>
      </div>
      <div class="flex flex-col md:flex-row gap-x-4 md:w-1/2">
        <FormTextInput
          v-model="email"
          color="foundation"
          label="email"
          name="email"
          :rules="emailRules"
          placeholder="Email address"
          wrapper-classes="flex-1 py-3 md:py-0"
        />
        <FormButton @click="onSubmit">Add</FormButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { isEmail, isRequired } from '~~/lib/common/helpers/validation'
import { useForm } from 'vee-validate'

type FormValues = { email: string }

const { handleSubmit } = useForm<FormValues>()
const { triggerNotification } = useGlobalToast()

const emailRules = [isEmail, isRequired]
// Placeholder
const dummyData = ref([
  {
    email: 'jaap.stam@houthakker.com',
    status: 'PRIMARY',
    id: 1
  },
  {
    email: 'lerat@1899.com',
    status: 'UNVERIFIED',
    id: 2
  },
  {
    email: 'jte@kiffe.com',
    status: 'VERIFIED',
    id: 3
  }
])

const email = ref('')

const onSubmit = handleSubmit(() => {
  triggerNotification({
    type: ToastNotificationType.Success,
    title: `${email.value} added`
  })

  // Placeholder
  dummyData.value.push({
    email,
    status: 'UNVERIFIED'
  })
})

const onDelete = (id: number) => {
  dummyData.value = dummyData.value.filter((item) => item.id !== id)
}

const onMakePrimary = (id: number) => {
  let primaryItem = null

  dummyData.value.forEach((item) => {
    if (item.id === id) {
      item.status = 'PRIMARY'
      primaryItem = item
    } else if (item.status === 'PRIMARY') {
      item.status = 'VERIFIED'
    }
  })

  if (primaryItem) {
    dummyData.value = dummyData.value.filter((item) => item.id !== id)
    dummyData.value.unshift(primaryItem)
  }
}
</script>
