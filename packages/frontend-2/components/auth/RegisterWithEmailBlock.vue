<!-- eslint-disable vue/no-v-html -->
<template>
  <form method="post" @submit="onSubmit">
    <div class="flex flex-col space-y-2">
      <FormTextInput
        type="text"
        name="name"
        label="Full Name"
        placeholder="My Name"
        :size="isSmallerOrEqualSm ? 'lg' : 'xl'"
        :rules="nameRules"
        :custom-icon="UserIcon"
        show-label
        :disabled="loading"
        auto-focus
      />
      <FormTextInput
        v-model="email"
        type="email"
        name="email"
        label="Email"
        placeholder="example@email.com"
        :size="isSmallerOrEqualSm ? 'lg' : 'xl'"
        :rules="emailRules"
        show-label
        :disabled="isEmailDisabled"
      />
      <FormTextInput
        v-model="password"
        type="password"
        name="password"
        label="Password"
        placeholder="Type a strong password"
        :size="isSmallerOrEqualSm ? 'lg' : 'xl'"
        :rules="passwordRules"
        show-label
        :disabled="loading"
      />
    </div>
    <AuthPasswordChecks :password="password" class="mt-2 overflow-hidden h-12 sm:h-8" />
    <div
      class="mt-3 text-xs flex items-center justify-center text-foreground-2 space-x-2"
    >
      <!-- 
        Note the newsletter consent box is here because i got very confused re layout of the panel
        and didn't figure out a better way to put it where i needed it to be
       -->
      <FormCheckbox
        v-model="newsletterConsent"
        name="newsletter"
        label="Opt in for exclusive Speckle news and tips"
      />
    </div>
    <FormButton submit full-width class="mt-4" :disabled="loading || !isMounted">
      Sign up
    </FormButton>
    <div
      v-if="serverInfo.termsOfService"
      class="mt-2 text-xs text-foreground-2 text-center terms-of-service"
      v-html="serverInfo.termsOfService"
    />
    <div class="mt-2 sm:mt-8 text-center text-xs sm:text-base">
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
import { UserIcon, ArrowRightIcon } from '@heroicons/vue/20/solid'
import { useIsSmallerOrEqualThanBreakpoint } from '~~/composables/browser'
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
const loading = ref(false)
const password = ref('')
const email = ref('')

const emailRules = [isEmail]
const nameRules = [isRequired]

const newsletterConsent = inject<Ref<boolean>>('newsletterconsent')

const { isSmallerOrEqualSm } = useIsSmallerOrEqualThanBreakpoint()

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
