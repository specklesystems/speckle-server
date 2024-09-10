<template>
  <LayoutDialog v-model:open="isOpen" max-width="xs" :buttons="dialogButtons">
    <template #header>Remove user</template>
    <div class="flex flex-col gap-4">
      <p>
        Are you sure you want to
        <strong>permanently remove</strong>
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
import { useMutation } from '@vue/apollo-composable'
import { LayoutDialog, type LayoutDialogButton } from '@speckle/ui-components'
import type { UserItem } from '~~/lib/server-management/helpers/types'
import { adminDeleteUserMutation } from '~~/lib/server-management/graphql/mutations'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import {
  ROOT_QUERY,
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage,
  modifyObjectFields
} from '~~/lib/common/helpers/graphql'
import type {
  AdminUserList,
  ProjectCollection
} from '~~/lib/common/generated/gql/graphql'

const props = defineProps<{
  open: boolean
  user: UserItem | null
}>()

const { triggerNotification } = useGlobalToast()
const { mutate: adminDeleteUser } = useMutation(adminDeleteUserMutation)

const isOpen = defineModel<boolean>('open', { required: true })

const deleteConfirmed = async () => {
  const userEmail = props.user?.email
  if (!userEmail) {
    return
  }

  const result = await adminDeleteUser(
    {
      userConfirmation: { email: userEmail }
    },
    {
      update: (cache, { data }) => {
        if (data?.adminDeleteUser) {
          // Remove user from cache
          const cacheId = getCacheId('AdminUserListItem', props.user?.id as string)
          cache.evict({
            id: cacheId
          })

          // Modify 'admin' field of ROOT_QUERY so that we can modify all `userList` instances
          modifyObjectFields<undefined, { [key: string]: AdminUserList }>(
            cache,
            ROOT_QUERY,
            (_fieldName, _variables, value, details) => {
              // Find all `userList` fields (there can be multiple due to differing variables)
              const userListFields = Object.keys(value).filter(
                (k) => details.revolveFieldNameAndVariables(k).fieldName === 'userList'
              )

              // Being careful not to mutate original `value`
              const newVal: typeof value = { ...value }

              // Iterate over each and adjust `items` and `totalCount`
              for (const field of userListFields) {
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

          // Modify 'admin' field of ROOT_QUERY so that we can delete all `projectList` instances, cause projects may have changed (deleted)
          modifyObjectFields<undefined, { [key: string]: ProjectCollection }>(
            cache,
            ROOT_QUERY,
            (_fieldName, _variables, value, details) => {
              // Find all `projectList` fields (there can be multiple due to differing variables)
              const projectListFields = Object.keys(value).filter(
                (k) =>
                  details.revolveFieldNameAndVariables(k).fieldName === 'projectList'
              )

              // Being careful not to mutate original `value`
              const newVal: typeof value = { ...value }

              for (const field of projectListFields) {
                delete newVal[field]
              }

              return newVal
            },
            { fieldNameWhitelist: ['admin'] }
          )
        }
      }
    }
  ).catch(convertThrowIntoFetchResult)

  if (result?.data?.adminDeleteUser) {
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'User deleted',
      description: 'The user has been successfully deleted'
    })
    isOpen.value = false
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to delete user',
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
    text: 'Remove',
    props: { color: 'primary' },
    onClick: deleteConfirmed
  }
]
</script>
