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
        color="secondary"
        size="xs"
        @click="resendVerificationEmail"
      >
        Resend verification email
      </FormButton>
    </div>
    <div class="flex flex-col md:flex-row">
      <div class="flex-1">
        <p class="text-sm font-semibold md:pt-1">{{ emailData.email }}</p>
        <p v-if="description" class="text-xs pt-1 text-foreground-disabled">
          {{ description }}
        </p>
      </div>
      <div class="flex gap-x-2 pt-4 md:pt-0">
        <FormButton
          v-if="emailData.status !== 'PRIMARY'"
          :disabled="emailData.status !== 'VERIFIED'"
          color="secondary"
          size="sm"
          @click="toggleMakePrimaryDialog"
        >
          Set as primary
        </FormButton>
        <FormButton
          :disabled="emailData.status === 'PRIMARY'"
          color="secondary"
          size="sm"
          @click="toggleDeleteDialog"
        >
          Delete
        </FormButton>
      </div>
    </div>
  </li>

  <SettingsUserEmailMakePrimaryDialog
    v-model:open="showMakePrimaryDialog"
    :email-address="emailData.email"
    @make-primary="$emit('make-primary')"
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
  (e: 'make-primary'): void
}>()

const { triggerNotification } = useGlobalToast()

const showDeleteDialog = ref(false)
const showMakePrimaryDialog = ref(false)

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

const toggleMakePrimaryDialog = () => {
  showMakePrimaryDialog.value = true
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
