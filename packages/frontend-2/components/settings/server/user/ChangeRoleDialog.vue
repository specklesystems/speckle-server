<template>
  <LayoutDialog v-model:open="isOpen" max-width="xs" :buttons="dialogButtons">
    <template #header>Update role</template>
    <div class="flex flex-col gap-4 text-sm text-foreground mb-4">
      <FormSelectServerRoles
        v-model="selectedRole"
        :allow-guest="isGuestMode"
        allow-admin
        show-label
        allow-archived
        :disabled="isCurrentUser"
      />

      <div
        v-if="
          user &&
          selectedRole === Roles.Server.Admin &&
          user.role !== Roles.Server.Admin
        "
        class="rounded-lg p-3 border bg-foundation-2"
      >
        <div class="text-body-2xs text-foreground">
          <p class="font-medium">Make sure you trust {{ user.name }}!</p>
          <p>An admin on the server has access to every resource.</p>
        </div>
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { LayoutDialog, type LayoutDialogButton } from '@speckle/ui-components'
import type { UserItem } from '~~/lib/server-management/helpers/types'
import { Roles } from '@speckle/shared'
import type { ServerRoles } from '@speckle/shared'
import { changeRoleMutation } from '~~/lib/server-management/graphql/mutations'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import { useMutation } from '@vue/apollo-composable'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { useServerInfo } from '~~/lib/core/composables/server'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'

const props = defineProps<{
  user: UserItem | null
}>()

const { triggerNotification } = useGlobalToast()
const { mutate: mutateChangeRole } = useMutation(changeRoleMutation)
const { isGuestMode } = useServerInfo()
const { activeUser } = useActiveUser()

const isOpen = defineModel<boolean>('open', { required: true })

const selectedRole = ref<ServerRoles | undefined>(
  props.user?.role as ServerRoles | undefined
)

const isCurrentUser = computed(() => props.user?.id === activeUser.value?.id)

const changeUserRoleConfirmed = async () => {
  if (!props.user || !selectedRole.value || selectedRole.value === props.user.role) {
    return
  }

  const userId = props.user.id
  const newRoleVal = selectedRole.value

  const result = await mutateChangeRole(
    {
      userRoleInput: { id: userId, role: newRoleVal }
    },
    {
      update: (cache, { data }) => {
        if (data?.userRoleChange) {
          cache.modify({
            id: getCacheId('AdminUserListItem', userId),
            fields: {
              role: () => newRoleVal
            }
          })
        }
      }
    }
  ).catch(convertThrowIntoFetchResult)

  if (result?.data?.userRoleChange) {
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'User role updated',
      description: 'The user role has been updated'
    })
    isOpen.value = false
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to update role',
      description: errorMessage
    })
  }
}

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Update',
    props: {
      color: 'primary',
      disabled: !selectedRole.value || selectedRole.value === props.user?.role
    },
    onClick: changeUserRoleConfirmed
  }
])

watch(
  isOpen,
  (open) => {
    if (open && props.user?.role) {
      selectedRole.value = props.user.role as ServerRoles
    }
  },
  { immediate: true }
)
</script>
