<template>
  <div class="flex items-center space-x-2">
    <UserAvatar />
    <span class="grow truncate">{{ selectedEmails.join(', ') }}</span>
    <div class="flex items-center space-x-2">
      <FormSelectServerRoles
        v-if="showServerRoleSelect"
        v-model="serverRole"
        :allow-guest="isGuestMode"
        :allow-admin="isAdmin"
        fixed-height
      />
      <span
        v-tippy="
          isTryingToSetGuestOwner ? `Server guests can't be project owners` : undefined
        "
      >
        <FormButton
          :disabled="isButtonDisabled"
          @click="
            () =>
              $emit('invite-emails', {
                emails: selectedEmails || [],
                streamRole,
                serverRole: showServerRoleSelect ? serverRole : undefined
              })
          "
        >
          Invite
        </FormButton>
      </span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Roles, StreamRoles, ServerRoles } from '@speckle/shared'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'

defineEmits<{
  (
    e: 'invite-emails',
    v: { emails: string[]; streamRole: StreamRoles; serverRole?: ServerRoles }
  ): void
}>()

const props = defineProps<{
  selectedEmails: string[]
  streamRole: StreamRoles
  disabled?: boolean
  isGuestMode?: boolean
}>()

const { isAdmin } = useActiveUser()

const serverRole = ref<ServerRoles>(Roles.Server.User)

const showServerRoleSelect = computed(() => props.isGuestMode || isAdmin.value)

const isTryingToSetGuestOwner = computed(() => {
  if (!showServerRoleSelect.value) return false
  if (
    serverRole.value === Roles.Server.Guest &&
    props.streamRole === Roles.Stream.Owner
  )
    return true
  return false
})

const isButtonDisabled = computed(() => {
  if (props.disabled) return true
  if (isTryingToSetGuestOwner.value) return true
  if (!props.selectedEmails.length) return true
  return false
})
</script>
