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
import { LayoutDialog } from '@speckle/ui-components'
import { UserItem } from '~~/lib/server-management/helpers/types'
import { graphql } from '~~/lib/common/generated/gql'
import { getUsers } from '~~/lib/server-management/graphql/queries'
import { useMutation } from '@vue/apollo-composable'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage,
  updateCacheByFilter
} from '~~/lib/common/helpers/graphql'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import { Exact, InputMaybe } from '~~/lib/common/generated/gql/graphql'

const adminDeleteUser = graphql(`
  mutation AdminPanelDeleteUser($userConfirmation: UserDeleteInput!) {
    adminDeleteUser(userConfirmation: $userConfirmation)
  }
`)

const props = defineProps<{
  title: string
  open: boolean
  user: UserItem | null
  resultVariables:
    | Exact<{
        limit: number
        cursor?: InputMaybe<string> | undefined
        query?: InputMaybe<string> | undefined
      }>
    | undefined
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
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

  const result = await adminDeleteUserMutation(
    {
      userConfirmation: { email: userEmail }
    },
    {
      update: (cache, { data }) => {
        if (data?.adminDeleteUser) {
          // Remove item from cache
          cache.evict({
            id: getCacheId('AdminUserListItem', userId)
          })

          // Update list
          updateCacheByFilter(
            cache,
            { query: { query: getUsers, variables: props.resultVariables } },
            (data) => {
              const newItems = data.admin.userList.items.filter(
                (item) => item.id !== userId
              )
              return {
                ...data,
                admin: {
                  ...data.admin,
                  userList: {
                    ...data.admin.userList,
                    items: newItems,
                    totalCount: Math.max(0, data.admin.userList.totalCount - 1)
                  }
                }
              }
            }
          )
        }
      }
    }
  ).catch(convertThrowIntoFetchResult)

  if (result?.data?.adminDeleteUser) {
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'User deleted',
      description: 'The user has been succesfully deleted'
    })
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
