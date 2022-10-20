<template>
  <LayoutPanel form class="mx-auto max-w-screen-md" @submit="onSubmit">
    <template #header>
      <span class="h5">Log in</span>
    </template>
    <template #default>
      <div class="flex flex-col space-y-8">
        <FormTextInput type="email" name="email" label="E-mail" :rules="emailRules" />
        <FormTextInput
          type="password"
          name="password"
          label="Password"
          :rules="passwordRules"
        />
      </div>
    </template>
    <template #footer>
      <FormButton submit>Submit</FormButton>
    </template>
  </LayoutPanel>
</template>
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { isEmail, isRequired } from '~~/lib/common/helpers/validation'
import { useLogin } from '~~/lib/auth/composables/login'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { ensureError } from '@speckle/shared'

type FormValues = { email: string; password: string }

const { handleSubmit } = useForm<FormValues>()
const emailRules = [isEmail]
const passwordRules = [isRequired]

const { login } = useLogin()
const { triggerNotification } = useGlobalToast()

const onSubmit = handleSubmit(async ({ email, password }) => {
  try {
    await login(email, password)
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
