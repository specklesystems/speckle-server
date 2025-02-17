<template>
  <div
    class="flex px-4 py-3 items-center space-x-2 justify-between border-b last:border-0 border-outline-3"
  >
    <div class="flex items-center space-x-2 flex-1 truncate">
      <UserAvatar :user="user" />
      <div
        v-if="
          user.workspaceDomainPolicyCompliant === false &&
          targetWorkspaceRole !== Roles.Workspace.Guest
        "
        v-tippy="
          'Users that do not comply with the domain policy can only be invited as guests'
        "
      >
        <ExclamationCircleIcon class="text-danger w-5 w-4" />
      </div>
      <span class="grow truncate text-body-sm">{{ user.name }}</span>
    </div>
    <span
      v-tippy="
        isTryingToSetGuestOwner
          ? `Server guests can't be project owners`
          : disabledMessage
      "
    >
      <FormButton
        :disabled="isButtonDisabled"
        size="sm"
        color="outline"
        @click="() => $emit('invite-user', { user, streamRole })"
      >
        Invite
      </FormButton>
    </span>
  </div>
</template>
<script setup lang="ts">
import { Roles } from '@speckle/shared'
import type { StreamRoles, WorkspaceRoles } from '@speckle/shared'
import type { UserSearchItem } from '~~/lib/common/composables/users'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'

defineEmits<{
  (e: 'invite-user', v: { user: UserSearchItem; streamRole: StreamRoles }): void
}>()

const props = defineProps<{
  streamRole: StreamRoles
  user: UserSearchItem
  disabled?: boolean
  disabledMessage?: string
  targetWorkspaceRole?: WorkspaceRoles
}>()

const isOwnerSelected = computed(() => props.streamRole === Roles.Stream.Owner)
const isTryingToSetGuestOwner = computed(
  () => props.user.role === Roles.Server.Guest && isOwnerSelected.value
)
const isButtonDisabled = computed(() => {
  if (props.disabled) return true
  if (isTryingToSetGuestOwner.value) return true
  if (props.user.workspaceDomainPolicyCompliant === false)
    return props.targetWorkspaceRole !== Roles.Workspace.Guest

  return false
})
</script>
