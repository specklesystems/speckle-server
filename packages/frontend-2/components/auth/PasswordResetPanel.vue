<template>
  <form class="mx-auto w-full px-2" @submit="onSubmit">
    <h1 class="text-heading-xl text-center inline-block mb-4 w-full">
      Reset your password
    </h1>
    <div class="flex flex-col space-y-4">
      <div class="text-body-xs text-foreground text-center mb-2">
        Enter your email address and we'll send you the password reset instructions.
      </div>
      <div>
        <FormTextInput
          name="resetEmail"
          color="foundation"
          size="lg"
          type="email"
          placeholder="email@example.com"
          :rules="emailRules"
        />
      </div>
    </div>
    <div class="flex flex-col gap-y-2 mt-8">
      <FormButton submit full-width size="lg" :disabled="loading">
        Send reset email
      </FormButton>
      <FormButton color="outline" size="lg" full-width :to="homeRoute">
        Back to login
      </FormButton>
    </div>
  </form>
</template>
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { homeRoute } from '~/lib/common/helpers/route'
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
