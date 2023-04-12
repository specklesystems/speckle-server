<template>
  <LayoutPanel form class="mx-auto max-w-screen-md" @submit="onSubmit">
    <template #header>
      <span class="h5 font-medium leading-7">Reset your account password</span>
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
import { usePasswordReset } from '~~/lib/auth/composables/passwordReset'
import { isEmail, isRequired } from '~~/lib/common/helpers/validation'

type FormValues = { resetEmail: string }

const { handleSubmit } = useForm<FormValues>()
const { sendResetEmail } = usePasswordReset()

const emailRules = [isEmail, isRequired]
const loading = ref(false)

const onSubmit = handleSubmit(
  async ({ resetEmail }) => await sendResetEmail(resetEmail)
)
</script>
