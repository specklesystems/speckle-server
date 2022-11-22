<template>
  <form @submit="onSubmit">
    <div class="flex flex-col space-y-4">
      <FormTextInput
        type="email"
        name="email"
        label="E-mail"
        placeholder="Enter your email"
        :rules="emailRules"
        show-label
      />
      <FormTextInput
        type="password"
        name="password"
        label="Password"
        placeholder="Enter your password"
        :rules="passwordRules"
        show-label
      />
    </div>
    <div class="mt-1">
      <TextLink :to="ForgottenPasswordRoute" size="sm">Forgot your password?</TextLink>
    </div>
    <FormButton submit full-width class="my-8">Log in</FormButton>
    <div class="text-center">
      <span class="mr-2">Don't have an account?</span>
      <TextLink :to="RegisterRoute">Register</TextLink>
    </div>
  </form>
</template>
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { isEmail, isRequired } from '~~/lib/common/helpers/validation'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { ensureError } from '@speckle/shared'
import { useAuthManager } from '~~/lib/auth/composables/auth'
import { ForgottenPasswordRoute, RegisterRoute } from '~~/lib/common/helpers/route'

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
  } catch (e) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Login failed',
      description: `${ensureError(e).message}`
    })
  }
})
</script>
