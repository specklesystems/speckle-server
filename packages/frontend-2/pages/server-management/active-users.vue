<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink to="/server-management" name="Server Management"></HeaderNavLink>
      <HeaderNavLink
        to="/server-management/active-users"
        name="Active Users"
      ></HeaderNavLink>
    </Portal>

    <h1 class="h4 font-bold mb-4">Active Users</h1>

    <FormTextInput
      size="lg"
      name="search"
      :custom-icon="MagnifyingGlassIcon"
      color="foundation"
      full-width
      search
      :show-clear="!!searchString"
      placeholder="Search Users"
      class="rounded-md border border-outline-3"
      @update:model-value="debounceSearchUpdate"
      @change="searchUpdateHandler(newSearchString)"
    />

    TOtals: {{ extraPagesResult?.admin.userList.totalCount }}

    <Table
      class="mt-8"
      :headers="[
        { id: 'name', title: 'Name' },
        { id: 'email', title: 'Email' },
        { id: 'emailState', title: 'Email State' },
        { id: 'company', title: 'Company' },
        { id: 'role', title: 'Role' }
      ]"
      :items="users"
      :buttons="[{ icon: TrashIcon, label: 'Delete', action: openUserDeleteDialog }]"
      :column-classes="{
        name: 'col-span-3',
        email: 'col-span-3',
        emailState: 'col-span-2',
        company: 'col-span-2',
        role: 'col-span-2'
      }"
      :overflow-cells="true"
    >
      <template #name="{ item }">
        <div class="flex items-center gap-2">
          <Avatar :user="item" />
          {{ item.name }}
        </div>
      </template>

      <template #email="{ item }">
        {{ isUser(item) ? item.email : '' }}
      </template>

      <template #emailState="{ item }">
        <div class="flex items-center gap-2 select-none">
          <template v-if="isUser(item) && item.verified">
            <ShieldCheckIcon class="h-4 w-4 text-primary" />
            <span>verified</span>
          </template>
          <template v-else>
            <ShieldExclamationIcon class="h-4 w-4 text-danger" />
            <span>not verified</span>
          </template>
        </div>
      </template>

      <template #company="{ item }">
        {{ isUser(item) ? item.company : '' }}
      </template>

      <template #role="{ item }">
        <UserRoleSelect
          :model-value="isUser(item) && item.role"
          @update:model-value="
            (newRoleValue) => openChangeUserRoleDialog(isUser(item), newRoleValue)
          "
        />
      </template>
    </Table>

    <InfiniteLoading
      :settings="{ identifier: infiniteLoaderId }"
      class="-mt-24 -mb-24"
      @infinite="infiniteLoad"
    />

    <UserDeleteDialog
      v-model:open="showUserDeleteDialog"
      :user="userToModify"
      title="Delete User"
      :buttons="[
        {
          text: 'Delete',
          props: { color: 'danger', fullWidth: true },
          onClick: deleteConfirmed
        },
        {
          text: 'Cancel',
          props: { color: 'secondary', fullWidth: true, outline: true },
          onClick: closeUserDeleteDialog
        }
      ]"
    />

    <ChangeUserRoleDialog
      v-model:open="showChangeUserRoleDialog"
      :user="userToModify"
      title="Change Role"
      :old-role="oldRole"
      :new-role="newRole"
      :hide-closer="true"
      :buttons="[
        {
          text: 'Change Role',
          props: { color: 'danger', fullWidth: true },
          onClick: changeUserRoleConfirmed
        },
        {
          text: 'Cancel',
          props: { color: 'secondary', fullWidth: true, outline: true },
          onClick: closeChangeUserRoleDialog
        }
      ]"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { debounce } from 'lodash-es'
import Table from '~~/components/server-management/Table.vue'
import UserRoleSelect from '~~/components/server-management/UserRoleSelect.vue'
import UserDeleteDialog from '~~/components/server-management/DeleteUserDialog.vue'
import ChangeUserRoleDialog from '~~/components/server-management/ChangeUserRoleDialog.vue'
import Avatar from '~~/components/user/Avatar.vue'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import { InfiniteLoaderState } from '~~/lib/global/helpers/components'
import { Nullable } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import { UserItem } from '~~/lib/server-management/helpers/types'

import {
  MagnifyingGlassIcon,
  ShieldExclamationIcon,
  ShieldCheckIcon,
  TrashIcon
} from '@heroicons/vue/20/solid'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage,
  updateCacheByFilter
} from '~~/lib/common/helpers/graphql'
import { useLogger } from '~~/composables/logging'
import { isUser } from '~~/lib/server-management/helpers/utils'

definePageMeta({
  middleware: ['admin']
})

const getUsers = graphql(`
  query AdminPanelUsersList($limit: Int!, $cursor: String, $query: String) {
    admin {
      userList(limit: $limit, cursor: $cursor, query: $query) {
        totalCount
        cursor
        items {
          id
          email
          avatar
          name
          role
          verified
          company
        }
      }
    }
  }
`)

const adminDeleteUser = graphql(`
  mutation AdminPanelDeleteUser($userConfirmation: UserDeleteInput!) {
    adminDeleteUser(userConfirmation: $userConfirmation)
  }
`)

const changeRoleMutation = graphql(`
  mutation AdminChangeUseRole($userRoleInput: UserRoleInput!) {
    userRoleChange(userRoleInput: $userRoleInput)
  }
`)

const userToModify: Ref<Nullable<UserItem>> = ref(null)
const searchString = ref('')
const showUserDeleteDialog = ref(false)
const showChangeUserRoleDialog = ref(false)
const newRole = ref('')
const oldRole = computed(() => userToModify.value?.role ?? '')
const logger = useLogger()
const infiniteLoaderId = ref('')

const queryVariables = computed(() => ({
  limit: 50,
  query: searchString.value
}))
const {
  result: extraPagesResult,
  fetchMore: fetchMorePages,
  variables: resultVariables,
  onResult
} = useQuery(getUsers, queryVariables)
const moreToLoad = computed(
  () =>
    !extraPagesResult.value?.admin?.userList ||
    extraPagesResult.value.admin.userList.items.length <
      extraPagesResult.value.admin.userList.totalCount
)
const users = computed(() => extraPagesResult.value?.admin.userList.items || [])

const { triggerNotification } = useGlobalToast()
const { mutate: adminDeleteUserMutation } = useMutation(adminDeleteUser)
const { mutate: mutateChangeRole } = useMutation(changeRoleMutation)

const openUserDeleteDialog = (user: UserItem) => {
  userToModify.value = user
  showUserDeleteDialog.value = true
}

const closeUserDeleteDialog = () => {
  showUserDeleteDialog.value = false
}

const openChangeUserRoleDialog = (user: UserItem, newRoleValue: string) => {
  console.log(userToModify)
  userToModify.value = user
  newRole.value = newRoleValue
  showChangeUserRoleDialog.value = true
}

const closeChangeUserRoleDialog = () => {
  showChangeUserRoleDialog.value = false
}

const deleteConfirmed = async () => {
  const userEmail = userToModify.value?.email
  const userId = userToModify.value?.id
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
            { query: { query: getUsers, variables: queryVariables.value } },
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
    closeUserDeleteDialog()
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'User deleted',
      description: 'The user has been succesfully deleted'
    })
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to delete user',
      description: errorMessage
    })
  }
}

const changeUserRoleConfirmed = async () => {
  if (!userToModify.value) {
    return
  }

  const userId = userToModify.value.id
  const newRoleVal = newRole.value

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
    closeChangeUserRoleDialog()
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'User role updated',
      description: 'The user role has been updated'
    })
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to update role',
      description: errorMessage
    })
  }
  showChangeUserRoleDialog.value = false
  userToModify.value = null
}

const infiniteLoad = async (state: InfiniteLoaderState) => {
  const cursor = extraPagesResult.value?.admin?.userList.cursor || null
  if (!moreToLoad.value || !cursor) return state.complete()

  try {
    await fetchMorePages({
      variables: {
        cursor
      }
    })
  } catch (e) {
    logger.error(e)
    state.error()
    return
  }

  state.loaded()
  if (!moreToLoad.value) {
    state.complete()
  }
}

const searchUpdateHandler = (value: string) => {
  searchString.value = value
}

const debounceSearchUpdate = debounce(searchUpdateHandler, 500)

const calculateLoaderId = () => {
  infiniteLoaderId.value = resultVariables.value?.query || ''
}

onResult(calculateLoaderId)
</script>
