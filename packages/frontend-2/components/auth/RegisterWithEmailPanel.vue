<template>
  <LayoutPanel form class="mx-auto max-w-screen-md" @submit="onSubmit">
    <template #header>
      <span class="h5">Create an account</span>
    </template>
    <template #default>
      <div class="flex flex-col space-y-8">
        <FormTextInput
          type="email"
          name="email"
          label="E-mail"
          :rules="emailRules"
          show-label
          show-required
        />
        <FormTextInput
          type="email"
          name="email-repeat"
          label="E-mail (repeat)"
          :rules="emailRepeatRules"
          show-label
          show-required
        />
        <FormTextInput
          type="text"
          name="name"
          label="Name"
          :rules="nameRules"
          show-label
          show-required
        />
        <FormTextInput type="text" name="company" label="Company/team" show-label />
        <FormTextInput
          type="password"
          name="password"
          label="Password"
          :rules="passwordRules"
          show-label
          show-required
        />
        <FormTextInput
          type="password"
          name="password-repeat"
          label="Password (repeat)"
          :rules="passwordRepeatRules"
          show-label
          show-required
        />
      </div>
    </template>
    <template #footer>
      <FormButton submit full-width>Submit</FormButton>
    </template>
  </LayoutPanel>
</template>
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { isEmail, isRequired, isSameAs } from '~~/lib/common/helpers/validation'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { ensureError } from '@speckle/shared'
import { useAuthManager } from '~~/lib/auth/composables/auth'
import { omit } from 'lodash'

/**
 * TODO:
 * - Password strength check
 */

type FormValues = { email: string; password: string; name: string; company?: string }

const props = defineProps<{
  challenge: string
}>()

const { handleSubmit } = useForm<FormValues>()

const emailRules = [isEmail]
const emailRepeatRules = [...emailRules, isSameAs('email')]
const passwordRules = [isRequired]
const passwordRepeatRules = [...passwordRules, isSameAs('password')]
const nameRules = [isRequired]

const { signUpWithEmail } = useAuthManager()
const { triggerNotification } = useGlobalToast()

const onSubmit = handleSubmit(async (fullUser) => {
  try {
    const user = omit(fullUser, ['email-repeat', 'password-repeat']) as FormValues
    await signUpWithEmail({ user, challenge: props.challenge })
  } catch (e) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Registration failed',
      description: `${ensureError(e).message}`
    })
  }
})
</script>
