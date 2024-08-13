<template>
  <div
    class="flex px-4 py-3 items-center space-x-2 border-b last:border-0 border-outline-3"
  >
    <UserAvatar :user="user" />
    <span class="grow truncate text-body-sm">{{ user.name }}</span>
    <span v-tippy="isTryingToSetGuestOwner ? settingGuestOwnerErrorMessage : undefined">
      <FormButton
        :disabled="isButtonDisabled"
        size="sm"
        color="outline"
        @click="() => $emit('invite-user')"
      >
        Invite
      </FormButton>
    </span>
  </div>
</template>
<script setup lang="ts">
import { Roles } from '@speckle/shared'
import type { UserSearchItem } from '~~/lib/common/composables/users'

defineEmits<{
  (e: 'invite-user'): void
}>()

const props = withDefaults(
  defineProps<{
    isOwnerRole: boolean
    user: UserSearchItem
    disabled?: boolean
    settingGuestOwnerErrorMessage?: string
  }>(),
  {
    settingGuestOwnerErrorMessage: "Server guests can't be workspace owners"
  }
)

const isTryingToSetGuestOwner = computed(
  () => props.user.role === Roles.Server.Guest && props.isOwnerRole
)
const isButtonDisabled = computed(() => {
  if (props.disabled) return true
  if (isTryingToSetGuestOwner.value) return true
  return false
})
</script>
