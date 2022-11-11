<template>
  <LayoutPanel form class="mx-auto max-w-screen-md" @submit="onSubmit">
    <template #header>
      <span class="h5">Sign in with email & password</span>
    </template>
    <template #default>
      <div class="flex flex-col space-y-8">
        <FormTextInput
          type="email"
          name="email"
          label="E-mail"
          :rules="emailRules"
          show-label
        />
        <FormTextInput
          type="password"
          name="password"
          label="Password"
          :rules="passwordRules"
          show-label
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
import { isEmail, isRequired } from '~~/lib/common/helpers/validation'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { ensureError } from '@speckle/shared'
import { useAuthManager } from '~~/lib/auth/composables/auth'

type FormValues = { email: string; password: string }

const props = defineProps<{
  challenge: string
}>()

const { handleSubmit } = useForm<FormValues>()
const emailRules = [isEmail]
const passwordRules = [isRequired]

const { loginWithEmail } = useAuthManager()
const { triggerNotification } = useGlobalToast()

const onSubmit = handleSubmit(async ({ email, password }) => {
  try {
    await loginWithEmail({ email, password, challenge: props.challenge })
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Login successful'
    })
  } catch (e) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Login failed',
      description: `${ensureError(e).message}`
    })
  }
})
</script>
