<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    title="Change Role"
    :buttons="dialogButtons"
  >
    <div class="flex flex-col gap-6 text-sm text-foreground">
      <p>
        Are you sure you want to
        <strong>change the role of</strong>
        the selected user?
      </p>
      <div v-if="user && newRole && oldRole" class="flex flex-col gap-3">
        <div class="flex items-center gap-2">
          <UserAvatar :user="user" />
          {{ user.name }}
        </div>
        <div class="flex gap-2 items-center">
          <span class="capitalize">{{ getRoleLabel(oldRole) }}</span>
          <ArrowLongRightIcon class="h-6 w-6" />
          <strong class="capitalize">{{ getRoleLabel(newRole) }}</strong>
        </div>
      </div>

      <div
        v-if="user && newRole === Roles.Server.Admin"
        class="flex gap-2 items-center bg-danger-lighter dark:bg-danger border-danger-darker dark:border-danger-lighter border rounded-lg p-2"
      >
        <ExclamationTriangleIcon
          class="h-8 w-8 mt-0.5 text-danger-darker dark:text-danger-lighter"
        />
        <div>
          <p>Make sure you trust {{ user.name }}!</p>
          <p>An admin on the server has access to every resource.</p>
        </div>
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { LayoutDialog } from '@speckle/ui-components'
import { UserItem } from '~~/lib/server-management/helpers/types'
import { Roles, ServerRoles } from '@speckle/shared'
import { ArrowLongRightIcon, ExclamationTriangleIcon } from '@heroicons/vue/20/solid'
import { getRoleLabel } from '~~/lib/server-management/helpers/utils'
import { changeRoleMutation } from '~~/lib/server-management/graphql/mutations'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import { useMutation } from '@vue/apollo-composable'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()

const props = defineProps<{
  open: boolean
  user: UserItem | null
  oldRole: ServerRoles | undefined
  newRole: ServerRoles | undefined
}>()

const { triggerNotification } = useGlobalToast()
const { mutate: mutateChangeRole } = useMutation(changeRoleMutation)

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

const changeUserRoleConfirmed = async () => {
  if (!props.user || !props.newRole) {
    return
  }

  const userId = props.user?.id
  const newRoleVal = props.newRole

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
    emit('update:open', false)
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to update role',
      description: errorMessage
    })
  }
  emit('update:open', false)
}

const dialogButtons = [
  {
    text: 'Change Role',
    props: { color: 'danger', fullWidth: true },
    onClick: changeUserRoleConfirmed
  },
  {
    text: 'Cancel',
    props: { color: 'secondary', fullWidth: true, outline: true },
    onClick: () => emit('update:open', false)
  }
]
</script>
