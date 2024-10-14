<template>
  <div
    class="flex px-4 py-3 items-center space-x-2 justify-between border-b last:border-0 border-outline-3"
  >
    <div class="flex items-center space-x-2 flex-1 truncate">
      <UserAvatar hide-tooltip :user="user" />
      <div
        v-if="
          user.workspaceDomainPolicyCompliant === false &&
          targetRole !== Roles.Workspace.Guest
        "
        v-tippy="
          'Users that do not comply with the domain policy can only be invited as guests'
        "
      >
        <ExclamationCircleIcon class="text-danger w-5 w-4" />
      </div>
      <span class="grow truncate text-body-sm">{{ user.name }}</span>
    </div>
    <span v-tippy="isTryingToSetGuestOwner ? settingGuestOwnerErrorMessage : undefined">
      <FormButton
        size="sm"
        color="outline"
        :disabled="isButtonDisabled"
        @click="() => $emit('invite-user')"
      >
        Invite
      </FormButton>
    </span>
  </div>
</template>
<script setup lang="ts">
import { Roles, type WorkspaceRoles } from '@speckle/shared'
import type { UserSearchItem } from '~~/lib/common/composables/users'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'

defineEmits<{
  (e: 'invite-user'): void
}>()

const props = withDefaults(
  defineProps<{
    isOwnerRole: boolean
    user: UserSearchItem
    disabled?: boolean
    settingGuestOwnerErrorMessage?: string
    targetRole: WorkspaceRoles
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
  if (props.user.workspaceDomainPolicyCompliant === false)
    return props.targetRole !== Roles.Workspace.Guest

  return false
})
</script>
