<template>
  <LayoutDialog v-model:open="isOpen" max-width="xs" :buttons="dialogButtons">
    <template #header>Delete invitation</template>
    <div class="flex flex-col gap-3 text-body-xs text-foreground mb-2">
      <p>Are you sure you want to delete the selected invitation?</p>
      <div
        v-if="invite"
        class="flex flex-col gap-1 bg-foundation-2 border border-outline-3 p-3 rounded-md text-body-2xs"
      >
        <div class="flex gap-1">
          <div class="w-20">Email:</div>
          <span class="font-medium">{{ invite.email }}</span>
        </div>
        <div class="flex items-center gap-1">
          <div class="w-20">Invited by:</div>
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
import { LayoutDialog, type LayoutDialogButton } from '@speckle/ui-components'
import type { InviteItem } from '~~/lib/server-management/helpers/types'
import { adminDeleteInviteMutation } from '~~/lib/server-management/graphql/mutations'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import {
  ROOT_QUERY,
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage,
  modifyObjectFields
} from '~~/lib/common/helpers/graphql'
import type { AdminInviteList } from '~~/lib/common/generated/gql/graphql'

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

const dialogButtons: LayoutDialogButton[] = [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => (isOpen.value = false)
  },
  {
    text: 'Delete',
    props: { color: 'danger' },
    onClick: deleteConfirmed
  }
]
</script>
