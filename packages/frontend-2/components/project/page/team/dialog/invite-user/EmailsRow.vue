<template>
  <div class="flex items-center space-x-2">
    <UserAvatar />
    <span class="grow truncate">{{ selectedEmails.join(', ') }}</span>
    <div class="flex items-center space-x-2">
      <FormButton
        :disabled="isButtonDisabled"
        @click="
          () => $emit('invite-emails', { emails: selectedEmails || [], streamRole })
        "
      >
        Invite
      </FormButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import { StreamRoles } from '@speckle/shared'

defineEmits<{
  (e: 'invite-emails', v: { emails: string[]; streamRole: StreamRoles }): void
}>()

const props = defineProps<{
  selectedEmails: string[]
  streamRole: StreamRoles
  disabled?: boolean
}>()

const isButtonDisabled = computed(() => {
  if (props.disabled) return true
  if (!props.selectedEmails.length) return true
  return false
})
</script>
