<template>
  <li
    class="border-outline-2 border-x border-b first:border-t first:rounded-t-lg last:rounded-b-lg p-6 border-b-outline-3 last:border-b-outline-2"
  >
    <div
      v-if="emailData.primary || !emailData.verified"
      class="flex w-full gap-x-2 pb-4 md:pb-3"
    >
      <CommonBadge v-if="emailData.primary" rounded>Primary</CommonBadge>
      <CommonBadge
        v-if="!emailData.verified"
        color-classes="text-foreground bg-outline-3"
        rounded
      >
        Unverified
      </CommonBadge>
      <FormButton
        v-if="!emailData.verified"
        color="outline"
        size="sm"
        @click="resendVerificationEmail"
      >
        Resend verification email
      </FormButton>
    </div>
    <div class="flex flex-col md:flex-row">
      <div class="flex-1">
        <p class="text-body-xs font-medium text-foreground md:pt-0.5">
          {{ emailData.email }}
        </p>
        <p v-if="description" class="text-body-2xs pt-1 text-foreground-2">
          {{ description }}
        </p>
      </div>
      <div class="flex gap-x-2 pt-4 md:pt-0">
        <div v-tippy="primaryTooltip">
          <FormButton
            :disabled="!emailData.verified || emailData.primary"
            color="outline"
            size="sm"
            @click="toggleSetPrimaryDialog"
          >
            Set as primary
          </FormButton>
        </div>
        <div
          v-tippy="emailData.primary ? 'Primary email cannot be deleted' : undefined"
        >
          <FormButton
            :disabled="emailData.primary"
            color="outline"
            size="sm"
            @click="toggleDeleteDialog"
          >
            Delete
          </FormButton>
        </div>
      </div>
    </div>

    <SettingsUserEmailSetPrimaryDialog
      v-model:open="showSetPrimaryDialog"
      :email-id="emailData.id"
      :email="emailData.email"
    />

    <SettingsUserEmailDeleteDialog
      v-model:open="showDeleteDialog"
      :email-id="emailData.id"
      :email="emailData.email"
    />
  </li>
</template>

<script setup lang="ts">
import type { SettingsUserEmailCards_UserEmailFragment } from '~~/lib/common/generated/gql/graphql'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import { graphql } from '~~/lib/common/generated/gql'
import { useMutation } from '@vue/apollo-composable'
import { settingsNewEmailVerificationMutation } from '~~/lib/settings/graphql/mutations'
import {
  getFirstErrorMessage,
  convertThrowIntoFetchResult
} from '~~/lib/common/helpers/graphql'

graphql(`
  fragment SettingsUserEmailCards_UserEmail on UserEmail {
    email
    id
    primary
    verified
  }
`)

const props = defineProps<{
  emailData: SettingsUserEmailCards_UserEmailFragment
}>()

const { triggerNotification } = useGlobalToast()
const { mutate: resendMutation } = useMutation(settingsNewEmailVerificationMutation)

const showDeleteDialog = ref(false)
const showSetPrimaryDialog = ref(false)

const primaryTooltip = computed(() => {
  if (props.emailData.primary) {
    return 'This is already your primary email'
  } else if (!props.emailData.verified) {
    return 'Unverified emails cannot be set as primary'
  }

  return undefined
})

const description = computed(() => {
  if (props.emailData.primary) {
    return 'Used for signing in and notifications'
  } else if (!props.emailData.verified) {
    return 'Unverified emails cannot be set as primary'
  }

  return null
})

const toggleSetPrimaryDialog = () => {
  showSetPrimaryDialog.value = true
}

const toggleDeleteDialog = () => {
  showDeleteDialog.value = true
}

const resendVerificationEmail = async () => {
  const result = await resendMutation({ input: { id: props.emailData.id } }).catch(
    convertThrowIntoFetchResult
  )
  if (result?.data) {
    triggerNotification({
      type: ToastNotificationType.Success,
      title: `Verification mail sent to ${props.emailData.email}`
    })
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: errorMessage
    })
  }
}
</script>
