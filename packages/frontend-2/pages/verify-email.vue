<template>
  <HeaderWithEmptyPage show-logo :logo-link="false">
    <template #header-actions>
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
        <span class="font-medium">{{ unverifiedEmail?.email }}</span>
      </p>
      <p class="text-center text-body-sm text-foreground mb-8">
        Paste (or type) it below to continue.
      </p>
      <FormCodeInput v-model="code" :error="hasError" @complete="console.log('done')" />
      <div class="mt-8 flex gap-2">
        <FormButton
          v-if="!isPrimaryEmail"
          color="subtle"
          size="sm"
          @click="showDeleteDialog = true"
        >
          Cancel
        </FormButton>
        <FormButton
          :disabled="isResendDisabled"
          color="outline"
          size="sm"
          @click="resendEmail"
        >
          {{
            cooldownRemaining > 0 ? `Resend in ${cooldownRemaining}s` : 'Resend code'
          }}
        </FormButton>
      </div>
      <SettingsUserEmailDeleteDialog
        v-model:open="showDeleteDialog"
        :email-id="unverifiedEmail?.id"
        :email="unverifiedEmail?.email"
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
import { useAuthManager } from '~/lib/auth/composables/auth'

useHead({
  title: 'Verify your email'
})

definePageMeta({
  middleware: ['auth', 'can-view-verify-email'],
  layout: 'empty'
})

const { unverifiedEmail, resendVerificationEmail } = useUserEmails()
const route = useRoute()
const { logout } = useAuthManager()

const code = ref('')
const hasError = ref(false)
const cooldownRemaining = ref(0)
const showDeleteDialog = ref(false)

const isResendDisabled = computed(() => cooldownRemaining.value > 0)
const isPrimaryEmail = computed(() => unverifiedEmail.value?.primary)

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
  if (!unverifiedEmail.value) return
  const success = await resendVerificationEmail(
    unverifiedEmail.value.id,
    unverifiedEmail.value?.email
  )
  if (success) {
    cooldownRemaining.value = 30
    startInterval()
  }
}

onMounted(() => {
  if (route.query.source === 'registration') {
    cooldownRemaining.value = 30
    startInterval()
  }
})
</script>
