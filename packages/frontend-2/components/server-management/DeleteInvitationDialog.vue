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
import { useMutation } from '@vue/apollo-composable'
import { LayoutDialog } from '@speckle/ui-components'
import { InviteItem } from '~~/lib/server-management/helpers/types'
import { getInvites } from '~~/lib/server-management/graphql/queries'
import { adminDeleteInvite } from '~~/lib/server-management/graphql/mutations'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage,
  updateCacheByFilter
} from '~~/lib/common/helpers/graphql'
import { Exact, InputMaybe } from '~~/lib/common/generated/gql/graphql'

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()

const props = defineProps<{
  title: string
  open: boolean
  invite: InviteItem | null
  resultVariables:
    | Exact<{
        limit: number
        cursor?: InputMaybe<string> | undefined
        query?: InputMaybe<string> | undefined
      }>
    | undefined
}>()

const { triggerNotification } = useGlobalToast()
const { mutate: adminDeleteMutation } = useMutation(adminDeleteInvite)

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

const deleteConfirmed = async () => {
  const inviteId = props.invite?.id
  if (!inviteId) {
    return
  }

  const result = await adminDeleteMutation(
    {
      inviteId
    },
    {
      update: (cache, { data }) => {
        if (data?.inviteDelete) {
          // Remove invite from cache
          cache.evict({
            id: getCacheId('AdminUserListItem', inviteId)
          })
          // Update list in cache
          updateCacheByFilter(
            cache,
            { query: { query: getInvites, variables: props.resultVariables } },
            (data) => {
              const newItems = data.admin.inviteList.items.filter(
                (item) => item.id !== inviteId
              )
              return {
                ...data,
                admin: {
                  ...data.admin,
                  inviteList: {
                    ...data.admin.inviteList,
                    items: newItems,
                    totalCount: Math.max(0, data.admin.inviteList.totalCount - 1)
                  }
                }
              }
            }
          )
        }
      }
    }
  ).catch(convertThrowIntoFetchResult)

  if (result?.data?.inviteDelete) {
    emit('update:open', false)
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Invitation deleted',
      description: 'The invitation has been successfully deleted'
    })
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
