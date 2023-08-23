<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    :title="title"
    :buttons="dialogButtons"
  >
    <div class="flex flex-col gap-6">
      <p>
        Are you sure you want to
        <strong>permanently delete</strong>
        the selected user?
      </p>
      <div v-if="user" class="flex items-center gap-2">
        <UserAvatar :user="user" />
        {{ user.name }}
      </div>
      <p>
        This action
        <strong>cannot</strong>
        be undone.
      </p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { LayoutDialog } from '@speckle/ui-components'
import { UserItem } from '~~/lib/server-management/helpers/types'
import { graphql } from '~~/lib/common/generated/gql'
import { useMutation } from '@vue/apollo-composable'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'

const adminDeleteUser = graphql(`
  mutation AdminPanelDeleteUser($userConfirmation: UserDeleteInput!) {
    adminDeleteUser(userConfirmation: $userConfirmation)
  }
`)

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'user-deleted', val: string): void
}>()

const props = defineProps<{
  title: string
  open: boolean
  user: UserItem | null
}>()

const { triggerNotification } = useGlobalToast()
const { mutate: adminDeleteUserMutation } = useMutation(adminDeleteUser)

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

const deleteConfirmed = async () => {
  const userEmail = props.user?.email
  const userId = props.user?.id
  if (!userEmail || !userId) {
    return
  }

  const result = await adminDeleteUserMutation({
    userConfirmation: { email: userEmail }
  }).catch(convertThrowIntoFetchResult)

  if (result?.data?.adminDeleteUser) {
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'User deleted',
      description: 'The user has been succesfully deleted'
    })
    emit('user-deleted', userId)
    emit('update:open', false)
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to delete user',
      description: errorMessage
    })
  }
}

const dialogButtons = [
  {
    text: 'Delete',
    props: { color: 'danger', fullWidth: true },
    onClick: deleteConfirmed
  },
  {
    text: 'Cancel',
    props: { color: 'secondary', fullWidth: true, outline: true },
    onClick: () => emit('update:open', false)
  }
]
</script>
