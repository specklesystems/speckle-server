<template>
  <div class="flex px-4 py-3 items-center space-x-2 justify-between">
    <div class="flex items-center space-x-2 flex-1 truncate">
      <UserAvatar />
      <div class="flex items-center space-x-2 flex-1 truncate">
        <div
          v-if="unmatchingDomainPolicy"
          v-tippy="
            'Users that do not comply with the domain policy can only be invited as guests'
          "
        >
          <ExclamationCircleIcon class="text-danger w-5 w-4" />
        </div>
        <span class="truncate text-body-sm flex-1">
          {{ selectedEmails.join(', ') }}
        </span>
      </div>
    </div>
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
          color="outline"
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
import { Roles } from '@speckle/shared'
import type { StreamRoles, ServerRoles } from '@speckle/shared'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'

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
  unmatchingDomainPolicy?: boolean
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
  if (props.unmatchingDomainPolicy) return true
  return false
})
</script>
