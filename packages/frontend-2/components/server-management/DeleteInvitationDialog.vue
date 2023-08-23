<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    :title="title"
    :buttons="dialogButtons"
  >
    <div class="flex flex-col gap-6 text-sm text-foreground">
      <p>Are you sure you want to delete the selected invitation?</p>
      <div v-if="invite" class="flex flex-col gap-2">
        <div class="flex gap-1">
          <div class="w-20">Email:</div>
          <strong>{{ invite.email }}</strong>
        </div>
        <div class="flex items-center gap-1">
          <div class="w-20">Invited by:</div>
          <UserAvatar :user="invite.invitedBy" />
          {{ invite.invitedBy.name }}
        </div>
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
import { InviteItem } from '~~/lib/server-management/helpers/types'
import { graphql } from '~~/lib/common/generated/gql'
import { useMutation } from '@vue/apollo-composable'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'

const adminDeleteInvite = graphql(`
  mutation AdminPanelDeleteInvite($inviteId: String!) {
    inviteDelete(inviteId: $inviteId)
  }
`)

const { triggerNotification } = useGlobalToast()
const { mutate: adminDeleteMutation } = useMutation(adminDeleteInvite)

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'invitation-deleted', val: string): void
}>()

const props = defineProps<{
  title: string
  open: boolean
  invite: InviteItem | null
}>()

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

const deleteConfirmed = async () => {
  const inviteId = props.invite?.id
  if (!inviteId) {
    return
  }

  const result = await adminDeleteMutation({
    inviteId
  }).catch(convertThrowIntoFetchResult)

  if (result?.data?.inviteDelete) {
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Invitation deleted',
      description: 'The invitation has been successfully deleted'
    })
    emit('invitation-deleted', inviteId)
    emit('update:open', false)
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to delete invitation',
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
