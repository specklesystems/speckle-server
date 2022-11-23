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
        :disabled="loading"
      />
      <FormTextInput
        type="email"
        name="email"
        label="E-mail"
        placeholder="example@email.com"
        :rules="emailRules"
        show-label
        :disabled="loading"
      />
      <FormTextInput
        v-model="password"
        type="password"
        name="password"
        label="Password"
        placeholder="Type a strong password"
        :rules="passwordRules"
        show-label
        :disabled="loading"
      />
    </div>
    <AuthPasswordChecks :password="password" class="mt-4" />
    <FormButton submit full-width class="mt-8" :disabled="loading">Sign up</FormButton>
    <div v-if="serverInfo.termsOfService" class="mt-8">
      {{ serverInfo.termsOfService }}
    </div>
    <div class="mt-8 text-center">
      <span class="mr-2">Already have an account?</span>
      <CommonTextLink :to="LoginRoute">Log in</CommonTextLink>
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

const loading = ref(false)
const password = ref('')

const emailRules = [isEmail]
const nameRules = [isRequired]

const { signUpWithEmail } = useAuthManager()
const { triggerNotification } = useGlobalToast()

const onSubmit = handleSubmit(async (fullUser) => {
  try {
    loading.value = true
    const user = fullUser
    await signUpWithEmail({ user, challenge: props.challenge })
  } catch (e) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Registration failed',
      description: `${ensureError(e).message}`
    })
  } finally {
    loading.value = false
  }
})
</script>
