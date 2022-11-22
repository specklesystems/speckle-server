<template>
  <form @submit="onSubmit">
    <div class="flex flex-col space-y-4">
      <FormTextInput
        type="text"
        name="name"
        label="Name"
        placeholder="John Doe"
        :rules="nameRules"
        :custom-icon="UserIcon"
        show-label
      />
      <FormTextInput
        type="email"
        name="email"
        label="E-mail"
        placeholder="example@email.com"
        :rules="emailRules"
        show-label
      />
      <FormTextInput
        v-model="password"
        type="password"
        name="password"
        label="Password"
        placeholder="Type a strong password"
        :rules="passwordRules"
        show-label
      />
    </div>
    <AuthPasswordChecks :password="password" class="mt-4" />
    <FormButton submit full-width class="mt-8">Sign up</FormButton>
    <div v-if="serverInfo.termsOfService" class="mt-8">
      {{ serverInfo.termsOfService }}
    </div>
    <div class="mt-8 text-center">
      <span class="mr-2">Already have an account?</span>
      <TextLink :to="LoginRoute">Log in</TextLink>
    </div>
  </form>
</template>
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { isEmail, isRequired } from '~~/lib/common/helpers/validation'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { ensureError } from '@speckle/shared'
import { useAuthManager } from '~~/lib/auth/composables/auth'
import { LoginRoute } from '~~/lib/common/helpers/route'
import { passwordRules } from '~~/lib/auth/helpers/validation'
import { graphql } from '~~/lib/common/generated/gql'
import { ServerTermsOfServicePrivacyPolicyFragmentFragment } from '~~/lib/common/generated/gql/graphql'
import { UserIcon } from '@heroicons/vue/20/solid'

/**
 * TODO:
 * - Disabled states for login/register
 * - (BE) Password strength check? Do we want to use it anymore?
 */

graphql(`
  fragment ServerTermsOfServicePrivacyPolicyFragment on ServerInfo {
    termsOfService
  }
`)

type FormValues = { email: string; password: string; name: string; company?: string }

const props = defineProps<{
  challenge: string
  serverInfo: ServerTermsOfServicePrivacyPolicyFragmentFragment
}>()

const { handleSubmit } = useForm<FormValues>()

const password = ref('')

const emailRules = [isEmail]
const nameRules = [isRequired]

const { signUpWithEmail } = useAuthManager()
const { triggerNotification } = useGlobalToast()

const onSubmit = handleSubmit(async (fullUser) => {
  try {
    const user = fullUser
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
