<template>
  <li
    class="border-x border-b first:border-t first:rounded-t-lg last:rounded-b-lg p-6"
    :class="`${emailData.status === 'VERIFIED' && 'py-6 md:py-10'}`"
  >
    <div
      v-if="emailData.status === 'PRIMARY' || emailData.status === 'UNVERIFIED'"
      class="flex w-full gap-x-2 pb-4 md:pb-3"
    >
      <CommonBadge rounded :color-classes="badgeClasses">
        {{ emailData.status }}
      </CommonBadge>
      <FormButton
        v-if="emailData.status === 'UNVERIFIED'"
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
          v-if="emailData.status !== 'PRIMARY'"
          :disabled="emailData.status !== 'VERIFIED'"
          color="outline"
          size="sm"
          @click="toggleSetPrimaryDialog"
        >
          Set as primary
        </FormButton>
        <FormButton
          :disabled="emailData.status === 'PRIMARY'"
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
    @deleted="$emit('deleted')"
  />
</template>

<script setup lang="ts">
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'

type EmailStatus = 'PRIMARY' | 'UNVERIFIED' | 'VERIFIED'

type EmailData = {
  email: string
  status: EmailStatus
  id: number
}

const props = defineProps<{
  emailData: EmailData
}>()

// TEMP
defineEmits<{
  (e: 'deleted'): void
  (e: 'set-primary'): void
}>()

const { triggerNotification } = useGlobalToast()

const showDeleteDialog = ref(false)
const showSetPrimaryDialog = ref(false)

const badgeClasses = computed(() => {
  const classes = {
    PRIMARY: 'bg-blue-100 text-blue-800',
    UNVERIFIED: 'bg-foundation-disabled text-foreground-disabled',
    VERIFIED: ''
  }
  return classes[props.emailData.status]
})

const description = computed(() => {
  if (props.emailData.status === 'PRIMARY') {
    return 'Used for sign in and notifications'
  } else if (props.emailData.status === 'UNVERIFIED') {
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
