<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    title="Delete Invitation"
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
import { useMutation } from '@vue/apollo-composable'
import { LayoutDialog } from '@speckle/ui-components'
import { InviteItem } from '~~/lib/server-management/helpers/types'
import { adminDeleteInviteMutation } from '~~/lib/server-management/graphql/mutations'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import {
  ROOT_QUERY,
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage,
  modifyObjectFields
} from '~~/lib/common/helpers/graphql'
import { AdminInviteList } from '~~/lib/common/generated/gql/graphql'

const props = defineProps<{
  open: boolean
  invite: InviteItem | null
}>()

const { triggerNotification } = useGlobalToast()
const { mutate: adminDeleteMutation } = useMutation(adminDeleteInviteMutation)

const isOpen = defineModel<boolean>('open', { required: true })

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
          const cacheId = getCacheId('ServerInvite', inviteId)
          cache.evict({
            id: cacheId
          })

          // Modify 'admin' field of ROOT_QUERY so that we can modify all `inviteList` instances
          modifyObjectFields<undefined, { [key: string]: AdminInviteList }>(
            cache,
            ROOT_QUERY,
            (_fieldName, _variables, value, details) => {
              // Find all `inviteList` fields (there can be multiple due to differing variables)
              const inviteListFields = Object.keys(value).filter(
                (k) =>
                  details.revolveFieldNameAndVariables(k).fieldName === 'inviteList'
              )

              // Being careful not to mutate original `value`
              const newVal: typeof value = { ...value }

              // Iterate over each and adjust `items` and `totalCount`
              for (const field of inviteListFields) {
                const oldItems = value[field]?.items || []
                const newItems = oldItems.filter((i) => i.__ref !== cacheId)

                newVal[field] = {
                  ...value[field],
                  ...(value[field]?.items ? { items: newItems } : {}),
                  totalCount: Math.max(0, (value[field]?.totalCount || 0) - 1)
                }
              }

              return newVal
            },
            { fieldNameWhitelist: ['admin'] }
          )
        }
      }
    }
  ).catch(convertThrowIntoFetchResult)

  if (result?.data?.inviteDelete) {
    isOpen.value = false
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
    onClick: () => (isOpen.value = false)
  }
]
</script>
