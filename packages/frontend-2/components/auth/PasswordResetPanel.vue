<template>
  <LayoutPanel form class="mx-auto max-w-screen-md" @submit="onSubmit">
    <template #header>
      <span class="h5">Reset your account password</span>
    </template>
    <template #default>
      <div class="flex flex-col space-y-8">
        <div>
          Type in the email address you used, so we can verify your account. We will
          send you instructions on how to reset your password.
        </div>
        <div>
          <FormTextInput
            name="resetEmail"
            type="email"
            placeholder="email@example.com"
            :rules="emailRules"
          />
        </div>
      </div>
    </template>
    <template #footer>
      <FormButton submit full-width :disabled="loading">Send reset e-mail</FormButton>
    </template>
  </LayoutPanel>
</template>
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { ensureError } from '@speckle/shared'
import { usePasswordReset } from '~~/lib/auth/composables/passwordReset'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { isEmail, isRequired } from '~~/lib/common/helpers/validation'

type FormValues = { resetEmail: string }

const { handleSubmit } = useForm<FormValues>()
const { sendResetEmail } = usePasswordReset()
const { triggerNotification } = useGlobalToast()

const emailRules = [isEmail, isRequired]
const loading = ref(false)

const onSubmit = handleSubmit(async ({ resetEmail }) => {
  try {
    loading.value = true
    await sendResetEmail(resetEmail)
    triggerNotification({
      type: ToastNotificationType.Info,
      title: 'Password reset process initialized',
      description: `We've sent you instructions on how to reset your password at ${resetEmail}`
    })
  } catch (e) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Password reset failed',
      description: `${ensureError(e).message}`
    })
  } finally {
    loading.value = false
  }
})
</script>
