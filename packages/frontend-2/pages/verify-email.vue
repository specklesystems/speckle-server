<template>
  <HeaderWithEmptyPage empty-header>
    <template #header-left>
      <HeaderLogoBlock no-link />
    </template>
    <template #header-right>
      <FormButton
        v-if="isPrimaryEmail"
        color="outline"
        size="sm"
        @click="() => logout({ skipRedirect: false })"
      >
        Sign out
      </FormButton>
      <FormButton v-else color="outline" size="sm" @click="showDeleteDialog = true">
        Cancel
      </FormButton>
    </template>

    <div class="flex flex-col items-center justify-center p-4">
      <h1 class="text-heading-xl text-forefround mb-6 font-normal">
        {{ isPrimaryEmail ? 'Verify your email' : 'Verify additional email' }}
      </h1>
      <p class="text-center text-body-sm text-foreground">
        We sent you a verification code to
        <span class="font-semibold">{{ currentEmail?.email }}</span>
      </p>
      <p class="text-center text-body-sm text-foreground mb-8">
        Paste (or type) it below to continue. Code expires in 5 minutes.
      </p>
      <FormCodeInput
        v-model="code"
        :error="hasError"
        @complete="handleVerificationComplete"
      />
      <div class="mt-8 flex items-center gap-2">
        <FormButton
          v-if="!isPrimaryEmail"
          color="subtle"
          size="sm"
          @click="showDeleteDialog = true"
        >
          Cancel
        </FormButton>
        <div
          :key="cooldownRemaining"
          v-tippy="
            cooldownRemaining > 0
              ? `You can send another code in ${cooldownRemaining}s`
              : undefined
          "
        >
          <FormButton
            :disabled="isResendDisabled"
            color="outline"
            size="sm"
            @click="resendEmail"
          >
            {{ isResendDisabled ? 'Code sent' : 'Resend code' }}
          </FormButton>
        </div>
      </div>
      <div v-if="!registeredThisSession" class="w-full max-w-sm mx-auto mt-8">
        <CommonAlert color="neutral" size="xs" hide-icon>
          <template #title>Why am I seeing this?</template>
          <template #description>
            This server now requires you to verify all email addresses before you can
            access your account.
          </template>
        </CommonAlert>
      </div>

      <SettingsUserEmailDeleteDialog
        v-model:open="showDeleteDialog"
        :email="currentEmail"
        cancel
      />
    </div>
  </HeaderWithEmptyPage>
</template>

<script setup lang="ts">
import { FormCodeInput } from '@speckle/ui-components'
import { useUserEmails } from '~/lib/user/composables/emails'
import { useIntervalFn } from '@vueuse/core'
import { useRoute } from 'vue-router'
import { useAuthManager, useRegisteredThisSession } from '~/lib/auth/composables/auth'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import type { UserEmail } from '~/lib/common/generated/gql/graphql'

useHead({
  title: 'Verify your email'
})

definePageMeta({
  middleware: ['auth'],
  layout: 'empty'
})

const {
  unverifiedPrimaryEmail,
  unverifiedEmails,
  resendVerificationEmail,
  verifyUserEmail,
  emails
} = useUserEmails()
const route = useRoute()
const { logout } = useAuthManager()
const { triggerNotification } = useGlobalToast()
const registeredThisSession = useRegisteredThisSession()

const code = ref('')
const hasError = ref(false)
const cooldownRemaining = ref(0)
const showDeleteDialog = ref(false)
const isLoading = ref(false)

// Get the email to verify - first check URL param, then fall back to primary or first unverified
const currentEmail = computed<UserEmail | undefined>(() => {
  const emailId = route.query.emailId as string
  if (emailId) {
    return emails.value.find((e) => e.id === emailId)
  }
  return unverifiedPrimaryEmail.value || (unverifiedEmails.value[0] ?? undefined)
})

const isResendDisabled = computed(() => cooldownRemaining.value > 0)
const isPrimaryEmail = computed(() => currentEmail.value?.primary ?? false)

const { pause: stopInterval, resume: startInterval } = useIntervalFn(
  () => {
    if (cooldownRemaining.value > 0) {
      cooldownRemaining.value--
    } else {
      stopInterval()
    }
  },
  1000,
  { immediate: false }
)

const resendEmail = async () => {
  if (!currentEmail.value) return
  const success = await resendVerificationEmail(currentEmail.value)
  if (success) {
    cooldownRemaining.value = 30
    startInterval()
  }
}

const handleVerificationComplete = async (code: string) => {
  if (!currentEmail.value) return
  if (isLoading.value) return

  hasError.value = false
  isLoading.value = true

  triggerNotification({
    type: ToastNotificationType.Loading,
    title: 'Verifying code'
  })

  try {
    const success = await verifyUserEmail(currentEmail.value, code)
    if (!success) {
      hasError.value = true
    }
  } finally {
    isLoading.value = false
  }
}

watch(code, () => {
  hasError.value = false
})

onMounted(() => {
  if (route.query.source === 'registration') {
    cooldownRemaining.value = 30
    startInterval()
  }
})
</script>
