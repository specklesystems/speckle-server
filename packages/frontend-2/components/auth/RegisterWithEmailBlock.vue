<!-- eslint-disable vue/no-v-html -->
<template>
  <form @submit="onSubmit">
    <div class="flex flex-col space-y-2">
      <FormTextInput
        type="text"
        name="name"
        label="Full Name"
        placeholder="John Doe"
        size="xl"
        :rules="nameRules"
        :custom-icon="UserIcon"
        show-label
        :disabled="loading"
        auto-focus
      />
      <FormTextInput
        type="email"
        name="email"
        label="Email"
        placeholder="example@email.com"
        size="xl"
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
        size="xl"
        :rules="passwordRules"
        show-label
        :disabled="loading"
        @focusin="pwdFocused = true"
        @focusout="pwdFocused = false"
      />
    </div>
    <AuthPasswordChecks
      :password="password"
      :class="`mt-2 overflow-hidden ${pwdFocused ? 'h-8' : 'h-0'} transition-[height]`"
    />
    <FormButton submit full-width class="mt-4" :disabled="loading">Sign up</FormButton>
    <div
      class="mt-3 text-xs flex items-center justify-center text-foreground-2 space-x-2"
    >
      <!-- 
        Note the newsletter consent box is here because i got very confused re layout of the panel
        and didn't figure out a better way to put it where i needed it to be
       -->
      <FormCheckbox
        v-model="newsletterConsent"
        name="test"
        label="I want to receive tips and tricks on how to use Speckle"
      />
    </div>
    <div
      v-if="serverInfo.termsOfService"
      class="mt-2 text-xs text-foreground-2 text-center linkify-tos"
      v-html="serverInfo.termsOfService"
    ></div>
    <div class="mt-8 text-center">
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
import { ServerTermsOfServicePrivacyPolicyFragmentFragment } from '~~/lib/common/generated/gql/graphql'
import { UserIcon, ArrowRightIcon } from '@heroicons/vue/20/solid'

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
}>()

const { handleSubmit } = useForm<FormValues>()
const router = useRouter()

const loading = ref(false)
const password = ref('')

const emailRules = [isEmail]
const nameRules = [isRequired]

const { signUpWithEmail, inviteToken } = useAuthManager()
const { triggerNotification } = useGlobalToast()

const newsletterConsent = inject<Ref<boolean>>('newsletterconsent')

const pwdFocused = ref(false)

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
      newsletter: newsletterConsent?.value
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
</script>
<style>
.linkify-tos a {
  text-decoration: underline;
}
</style>
