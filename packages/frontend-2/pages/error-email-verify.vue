<template>
  <div class="mt-20 flex flex-col items-center">
    <h1 class="h1 font-medium mb-14">Notice</h1>
    <div class="flex flex-col space-y-24 md:space-y-0 md:flex-row md:items-stretch">
      <div class="w-full md:w-72 lg:w-96 flex flex-col space-y-6 justify-between">
        <div class="text-heading">
          You've previously registered with your
          <strong>e-mail address</strong>
          and a
          <strong>password.</strong>
          Please use those credentials to log in.
        </div>
        <div class="flex justify-center">
          <FormButton size="lg" :icon-left="ArrowLeftIcon" :to="loginRoute">
            Go to login
          </FormButton>
        </div>
      </div>
      <div class="hidden md:block border border-foreground my-4 mx-6" />
      <div class="w-full md:w-72 lg:w-96 flex flex-col space-y-6 justify-between">
        <div class="text-heading">
          After
          <strong>verifying</strong>
          your e-mail address you can use also use the connected account to log in.
        </div>
        <div class="flex justify-center">
          <FormButton
            v-if="hasEmail"
            size="lg"
            :icon-left="PaperAirplaneIcon"
            :disabled="resendVerificationEmailLoading"
            @click="onResend"
          >
            Resend verification
          </FormButton>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { PaperAirplaneIcon } from '@heroicons/vue/24/outline'
import { ArrowLeftIcon } from '@heroicons/vue/24/solid'
import type { Optional } from '@speckle/shared'
import { ValidationHelpers } from '@speckle/ui-components'
import { useMutation } from '@vue/apollo-composable'
import { requestVerificationByEmailMutation } from '~/lib/auth/graphql/mutations'
import { useGlobalToast, ToastNotificationType } from '~/lib/common/composables/toast'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~/lib/common/helpers/graphql'
import { loginRoute } from '~/lib/common/helpers/route'

definePageMeta({
  middleware: 'guest'
})

const route = useRoute()
const { mutate: resendVerificationEmail, loading: resendVerificationEmailLoading } =
  useMutation(requestVerificationByEmailMutation)
const { triggerNotification } = useGlobalToast()

const email = computed(() => route.query.email as Optional<string>)
const hasEmail = computed(
  () => !!email.value?.length && ValidationHelpers.VALID_EMAIL.exec(email.value)
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
  } else {
    const errMsg = getFirstErrorMessage(res?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Error sending verification email',
      description: errMsg
    })
  }
}
</script>
