<template>
  <li class="border-x border-b first:border-t first:rounded-t-lg last:rounded-b-lg p-6">
    <div
      v-if="emailData.primary || !emailData.verified"
      class="flex w-full gap-x-2 pb-4 md:pb-3"
    >
      <CommonBadge
        v-if="emailData.primary"
        rounded
        color-classes="bg-primary text-foundation"
      >
        Primary
      </CommonBadge>
      <CommonBadge
        v-if="!emailData.verified"
        rounded
        color-classes="bg-foundation-disabled text-foreground-disabled"
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
        <FormButton
          :disabled="!emailData.verified || emailData.primary"
          color="outline"
          size="sm"
          @click="toggleSetPrimaryDialog"
        >
          Set as primary
        </FormButton>
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
  </li>

  <SettingsUserEmailSetPrimaryDialog
    v-model:open="showSetPrimaryDialog"
    :email-address="emailData.email"
    @set-primary="$emit('set-primary')"
  />

  <SettingsUserEmailDeleteDialog
    v-model:open="showDeleteDialog"
    :email-address="emailData.email"
    @delete="$emit('delete')"
  />
</template>

<script setup lang="ts">
import type { SettingsUserEmailCards_UserEmailFragment } from '~~/lib/common/generated/gql/graphql'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'

const props = defineProps<{
  emailData: SettingsUserEmailCards_UserEmailFragment
}>()

defineEmits<{
  (e: 'delete'): void
  (e: 'set-primary'): void
}>()

const { triggerNotification } = useGlobalToast()

const showDeleteDialog = ref(false)
const showSetPrimaryDialog = ref(false)

const description = computed(() => {
  if (props.emailData.primary) {
    return 'Used for sign in and notifications'
  } else if (!props.emailData.verified) {
    return 'Unverified email cannot be set as primary'
  }

  return null
})

const toggleSetPrimaryDialog = () => {
  showSetPrimaryDialog.value = true
}

const toggleDeleteDialog = () => {
  showDeleteDialog.value = true
}

const resendVerificationEmail = () => {
  triggerNotification({
    type: ToastNotificationType.Success,
    title: `Verification mail sent to ${props.emailData.email}`
  })
}
</script>
