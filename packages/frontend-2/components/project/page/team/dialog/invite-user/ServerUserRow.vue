<template>
  <div class="flex items-center space-x-2">
    <UserAvatar :user="user" />
    <span class="grow truncate">{{ user.name }}</span>
    <span
      v-tippy="
        isTryingToSetGuestOwner ? `Server guests can't be project owners` : undefined
      "
    >
      <FormButton
        :disabled="isButtonDisabled"
        @click="() => $emit('invite-user', { user, streamRole })"
      >
        Invite
      </FormButton>
    </span>
  </div>
</template>
<script setup lang="ts">
import { StreamRoles, Roles } from '@speckle/shared'
import { UserSearchItem } from '~~/lib/common/composables/users'

defineEmits<{
  (e: 'invite-user', v: { user: UserSearchItem; streamRole: StreamRoles }): void
}>()

const props = defineProps<{
  streamRole: StreamRoles
  user: UserSearchItem
  disabled?: boolean
}>()

const isOwnerSelected = computed(() => props.streamRole === Roles.Stream.Owner)
const isTryingToSetGuestOwner = computed(
  () => props.user.role === Roles.Server.Guest && isOwnerSelected.value
)
const isButtonDisabled = computed(() => {
  if (props.disabled) return true
  if (isTryingToSetGuestOwner.value) return true
  return false
})
</script>
