<!-- eslint-disable vue/no-v-html -->
<template>
  <form method="post" @submit="onSubmit">
    <div class="flex flex-col space-y-2">
      <FormTextInput
        v-model="email"
        type="email"
        name="email"
        label="Work email"
        placeholder="Email"
        size="lg"
        color="foundation"
        :rules="emailRules"
        show-label
        :disabled="isEmailDisabled"
        autocomplete="email"
      />
      <FormTextInput
        type="text"
        name="name"
        label="Full name"
        placeholder="My name"
        size="lg"
        :rules="nameRules"
        color="foundation"
        show-label
        :disabled="loading"
        auto-focus
        autocomplete="name"
      />
      <FormTextInput
        v-model="password"
        type="password"
        name="password"
        label="Password"
        placeholder="Type a strong password"
        color="foundation"
        size="lg"
        :rules="passwordRules"
        show-label
        :disabled="loading"
        autocomplete="new-password"
      />
    </div>
    <AuthPasswordChecks :password="password" class="mt-2 h-12 sm:h-8" />
    <div class="mt-8 flex px-2">
      <AuthRegisterNewsletter v-model:newsletter-consent="newsletterConsent" />
    </div>
    <FormButton
      submit
      full-width
      size="lg"
      class="mt-5"
      :disabled="loading || !isMounted"
    >
      Sign up
    </FormButton>
    <AuthRegisterTerms v-if="serverInfo.termsOfService" :server-info="serverInfo" />
    <div v-if="!inviteEmail" class="mt-2 sm:mt-4 text-center text-body-xs">
      <span class="mr-2 text-foreground-3">Already have an account?</span>
      <NuxtLink class="text-foreground" :to="finalLoginRoute">Log in</NuxtLink>
    </div>
  </form>
</template>
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { isEmail, isRequired } from '~~/lib/common/helpers/validation'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { ensureError } from '@speckle/shared'
import { useAuthManager } from '~~/lib/auth/composables/auth'
import { loginRoute } from '~~/lib/common/helpers/route'
import {
  passwordRules,
  doesNotContainBlockedDomain
} from '~~/lib/auth/helpers/validation'
import { graphql } from '~~/lib/common/generated/gql'
import type { ServerTermsOfServicePrivacyPolicyFragmentFragment } from '~~/lib/common/generated/gql/graphql'
import { useMounted } from '@vueuse/core'

graphql(`
  fragment ServerTermsOfServicePrivacyPolicyFragment on ServerInfo {
    termsOfService
  }
`)

type FormValues = { email: string; password: string; name: string; company?: string }

const props = defineProps<{
  challenge: string
  serverInfo: ServerTermsOfServicePrivacyPolicyFragmentFragment
  inviteEmail?: string
}>()

const { handleSubmit } = useForm<FormValues>()
const router = useRouter()
const { signUpWithEmail, inviteToken } = useAuthManager()
const { triggerNotification } = useGlobalToast()
const isMounted = useMounted()

const newsletterConsent = defineModel<boolean>('newsletterConsent', { required: true })
const loading = ref(false)
const password = ref('')
const email = ref('')

const emailRules = computed(() =>
  inviteToken.value ? [isEmail] : [isEmail, doesNotContainBlockedDomain]
)
const nameRules = [isRequired]

const isEmailDisabled = computed(() => !!props.inviteEmail?.length || loading.value)

const finalLoginRoute = computed(() => {
  const result = router.resolve({
    path: loginRoute,
    query: inviteToken.value ? { token: inviteToken.value } : {}
  })
  return result.fullPath
})

const onSubmit = handleSubmit(async (fullUser) => {
  try {
    loading.value = true
    const user = fullUser
    await signUpWithEmail({
      user,
      challenge: props.challenge,
      inviteToken: inviteToken.value,
      newsletter: newsletterConsent.value
    })
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

watch(
  () => props.inviteEmail,
  (inviteEmail) => {
    if (inviteEmail) {
      email.value = inviteEmail
    }
  },
  { immediate: true }
)
</script>
