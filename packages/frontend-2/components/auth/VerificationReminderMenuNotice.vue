<template>
  <div
    v-if="shouldShowBanner"
    class="flex flex-col mx-2 mt-1 mb-2 p-2 bg-warning text-warning-darker rounded-md"
  >
    <div class="text-sm">{{ verifyBannerText }}</div>
    <div class="">
      <FormButton
        size="sm"
        :disabled="loading"
        link
        class="font-bold text-danger-darker"
        @click="requestVerification"
      >
        {{ verifyBannerCtaText }}
      </FormButton>
      <!-- <CommonTextLink @click="dismiss">
        <XMarkIcon class="h-6 w-6" />
      </CommonTextLink> -->
    </div>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { useApolloClient, useQuery } from '@vue/apollo-composable'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'

const reminderStateQuery = graphql(`
  query EmailVerificationBannerState {
    activeUser {
      id
      email
      verified
      hasPendingVerification
    }
  }
`)

const requestVerificationMutation = graphql(`
  mutation RequestVerification {
    requestVerification
  }
`)

const apollo = useApolloClient().client
const { triggerNotification } = useGlobalToast()

const { result } = useQuery(reminderStateQuery)
const user = computed(() => result.value?.activeUser || null)

const dismissed = ref(false)
const loading = ref(false)

const shouldShowBanner = computed(() => {
  if (!user.value) return false
  if (user.value.verified) return false
  if (dismissed.value) return false

  return true
})
const hasPendingVerification = computed(() => !!user.value?.hasPendingVerification)

const verifyBannerText = computed(() => {
  if (!user.value?.email) return ''
  return hasPendingVerification.value
    ? `Please check your inbox (${user.value.email}) for the verification e-mail`
    : `Please verify your e-mail address.`
})

const verifyBannerCtaText = computed(() =>
  hasPendingVerification.value ? `Re-send verification` : `Send verification`
)

const dismiss = () => (dismissed.value = true)
const requestVerification = async () => {
  const userData = user.value
  if (!userData) return

  loading.value = true
  const { data, errors } = await apollo
    .mutate({
      mutation: requestVerificationMutation,
      update: (cache, { data }) => {
        const isSuccess = !!data?.requestVerification
        if (!isSuccess) return

        // Switch hasPendingVerification to true
        cache.modify({
          id: cache.identify(userData),
          fields: {
            hasPendingVerification: () => true
          }
        })
      }
    })
    .catch(convertThrowIntoFetchResult)
    .finally(() => (loading.value = false))

  if (!data?.requestVerification) {
    const errMsg = getFirstErrorMessage(errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Resend failed',
      description: errMsg
    })
  } else {
    triggerNotification({
      type: ToastNotificationType.Info,
      title: 'Verification e-mail sent, please check your inbox'
    })
    dismiss()
  }
}
</script>
