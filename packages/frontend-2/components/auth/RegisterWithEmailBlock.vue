<!-- eslint-disable vue/no-v-html -->
<template>
  <form method="post" @submit="onSubmit">
    <div class="flex flex-col space-y-2">
      <FormTextInput
        v-model="email"
        type="email"
        name="email"
        label="Email"
        placeholder="Email"
        size="lg"
        color="foundation"
        :rules="emailRules"
        show-label
        :disabled="isEmailDisabled"
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
      />
    </div>
    <AuthPasswordChecks :password="password" class="mt-2 h-12 sm:h-8" />
    <div class="mt-8 text-body-2xs flex px-2 text-foreground-2 space-x-2">
      <!-- 
        Note the newsletter consent box is here because i got very confused re layout of the panel
        and didn't figure out a better way to put it where i needed it to be
       -->
      <FormCheckbox
        v-model="newsletterConsent"
        name="newsletter"
        label="Opt in for exclusive Speckle news and tips"
        class="text-body-xs"
      />
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
    <div
      v-if="serverInfo.termsOfService"
      class="mt-2 text-body-2xs text-foreground-2 text-center terms-of-service"
      v-html="serverInfo.termsOfService"
    />
    <div v-if="!inviteEmail" class="mt-2 sm:mt-4 text-center text-body-sm">
      <span class="mr-2">Already have an account?</span>
      <CommonTextLink :to="finalLoginRoute" :icon-right="ArrowRightIcon">
        Log in
      </CommonTextLink>
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
import { passwordRules } from '~~/lib/auth/helpers/validation'
import { graphql } from '~~/lib/common/generated/gql'
import type { ServerTermsOfServicePrivacyPolicyFragmentFragment } from '~~/lib/common/generated/gql/graphql'
import { ArrowRightIcon } from '@heroicons/vue/20/solid'
import { useMounted } from '@vueuse/core'

/**
 * TODO:
 * - (BE) Password strength check? Do we want to use it anymore?
 * - Dim's answer: no, `passwordRules` are legit enough for now.
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

const emailRules = [isEmail]
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
