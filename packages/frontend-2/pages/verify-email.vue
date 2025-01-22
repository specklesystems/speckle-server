<template>
  <div class="flex flex-col items-center justify-center p-4">
    <h1 class="text-heading-xl text-forefround mb-6 font-normal">Check your inbox</h1>
    <p class="text-center text-body-sm text-foreground">
      We sent you a verification code to
      <span class="font-medium">{{ email }}.</span>
    </p>
    <p class="text-center text-body-sm text-foreground mb-8">
      Paste (or type) it below to continue.
    </p>
    <FormCodeInput v-model="code" :error="hasError" @complete="verifyCode" />
    <div class="mt-8">
      <FormButton
        v-if="hasEmail"
        :disabled="isResendDisabled"
        color="outline"
        size="sm"
        @click="onResend"
      >
        {{
          cooldownRemaining > 0 && fromRegistration
            ? `Resend in ${cooldownRemaining}s`
            : 'Resend code'
        }}
      </FormButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FormCodeInput, ValidationHelpers } from '@speckle/ui-components'
import { useMutation } from '@vue/apollo-composable'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { requestVerificationByEmailMutation } from '~/lib/auth/graphql/mutations'
import { useGlobalToast, ToastNotificationType } from '~/lib/common/composables/toast'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~/lib/common/helpers/graphql'
import { useIntervalFn } from '@vueuse/core'
import { useRoute } from 'vue-router'

useHead({ title: 'Verify Email' })

definePageMeta({
  layout: 'onboarding',
  middleware: ['auth', 'can-view-verify-email']
})

const mixpanel = useMixpanel()
const { activeUser } = useActiveUser()
const { triggerNotification } = useGlobalToast()
const route = useRoute()

const { pause: stopCooldown, resume } = useIntervalFn(
  () => {
    if (cooldownRemaining.value > 0) {
      cooldownRemaining.value--
    } else {
      stopCooldown()
    }
  },
  1000,
  { immediate: false }
)

const code = ref('')
const hasError = ref(false)

const email = computed(() => activeUser.value?.email)
const hasEmail = computed(
  () => !!email.value?.length && ValidationHelpers.VALID_EMAIL.exec(email.value)
)

const fromRegistration = computed(() => route.query.source === 'registration')

const COOLDOWN_SECONDS = 30
const cooldownRemaining = ref(COOLDOWN_SECONDS)

const startCooldown = () => {
  cooldownRemaining.value = COOLDOWN_SECONDS
  stopCooldown()
  resume()
}

const { mutate: resendVerificationEmail, loading: resendVerificationEmailLoading } =
  useMutation(requestVerificationByEmailMutation)

const isResendDisabled = computed(
  () =>
    resendVerificationEmailLoading.value ||
    (fromRegistration.value && cooldownRemaining.value > 0)
)

const onResend = async () => {
  const emailAddress = email.value
  if (!emailAddress || !hasEmail.value) return

  const res = await resendVerificationEmail({ email: emailAddress }).catch(
    convertThrowIntoFetchResult
  )
  if (res?.data?.requestVerificationByEmail) {
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Verification email (re-)sent successfully'
    })
    startCooldown()
  } else {
    const errMsg = getFirstErrorMessage(res?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Error sending verification email',
      description: errMsg
    })
  }
}

const verifyCode = () => {
  try {
    hasError.value = false
    triggerNotification({
      type: ToastNotificationType.Loading,
      title: 'Verifying code...'
    })
    // TODO: Add verification API call here
    // await verifyEmailCode(value)
    mixpanel.track('Email Verification Success')
  } catch (error) {
    hasError.value = true
    mixpanel.track('Email Verification Failed')
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Invalid verification code'
    })
  }
}

onMounted(() => {
  mixpanel.track('Visit Email Verification', {
    source: fromRegistration.value ? 'registration' : 'middleware'
  })
  if (fromRegistration.value) {
    resume() // Only start countdown if coming from registration
  }
})
</script>
