<template>
  <form @submit="onSubmit">
    <div class="flex flex-col space-y-4">
      <FormTextInput
        type="text"
        name="name"
        label="Name"
        placeholder="John Doe"
        :rules="nameRules"
        show-label
      />
      <FormTextInput
        type="email"
        name="email"
        label="E-mail"
        placeholder="E-mail"
        :rules="emailRules"
        show-label
      />
      <FormTextInput
        type="email"
        name="email-repeat"
        label="E-mail (repeat)"
        placeholder="E-mail"
        :rules="emailRepeatRules"
        show-label
      />
      <FormTextInput
        v-model="password"
        type="password"
        name="password"
        label="Password"
        placeholder="Password"
        :rules="passwordRules"
        show-label
      />
      <FormTextInput
        type="password"
        name="password-repeat"
        label="Password (repeat)"
        placeholder="Password"
        :rules="passwordRepeatRules"
        show-label
      />
    </div>
    <AuthPasswordChecks :password="password" class="mt-4" />
    <FormButton submit full-width class="my-8">Sign up</FormButton>
    <div>
      Signing up for a Speckle account means you agree to the Terms of Use and Privacy
      Policy.
    </div>
    <div class="mt-8 text-center">
      <span class="mr-2">Already have an account?</span>
      <TextLink :to="LoginRoute">Log in</TextLink>
    </div>
  </form>
</template>
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { isEmail, isRequired, isSameAs } from '~~/lib/common/helpers/validation'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { ensureError } from '@speckle/shared'
import { useAuthManager } from '~~/lib/auth/composables/auth'
import { omit } from 'lodash'
import { LoginRoute } from '~~/lib/common/helpers/route'
import { passwordRules } from '~~/lib/auth/helpers/validation'

/**
 * TODO:
 * - Disabled states for login/register
 * - Password strength check? Do we want to use it anymore?
 * - TOS & Privacy Policy links (currently they support HTML)
 */

type FormValues = { email: string; password: string; name: string; company?: string }

const props = defineProps<{
  challenge: string
}>()

const { handleSubmit } = useForm<FormValues>()

const password = ref('')

const emailRules = [isEmail]
const emailRepeatRules = [...emailRules, isSameAs('email')]
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
