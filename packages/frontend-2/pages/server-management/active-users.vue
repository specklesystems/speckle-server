<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink
        :to="'/server-management'"
        name="Server Management"
      ></HeaderNavLink>
      <HeaderNavLink
        :to="'/server-management/active-users/'"
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
      @change="handleSearchChange"
    />

    <Table
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
    >
      <template #name="{ item }">
        <div class="flex items-center gap-2">
          <Avatar :user="item" />
          {{ item.name }}
        </div>
      </template>

      <template #email="{ item }">
        {{ item.email }}
      </template>

      <template #emailState="{ item }">
        <div class="flex items-center gap-2">
          <template v-if="item.verified">
            <ShieldCheckIcon class="h-4 w-4 text-primary" />
            <span>Verified</span>
          </template>
          <template v-else>
            <ShieldExclamationIcon class="h-4 w-4 text-danger" />
            <span>Not Verified</span>
          </template>
        </div>
      </template>

      <template #company="{ item }">
        {{ item.company }}
      </template>

      <template #role="{ item }">
        <UserRoleSelect v-model="item.role" />
      </template>
    </Table>

    <InfiniteLoading
      :settings="{ identifier: infiniteLoaderId }"
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
      :old-role="userToModify?.role ?? 'defaultRole'"
      :new-role="newRole"
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
import { User } from '~~/lib/common/generated/gql/graphql'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'

import { InfiniteLoaderState } from '~~/lib/global/helpers/components'
import { graphql } from '~~/lib/common/generated/gql'

import {
  MagnifyingGlassIcon,
  ShieldExclamationIcon,
  ShieldCheckIcon,
  TrashIcon
} from '@heroicons/vue/20/solid'

const userToModify = ref<User | null>(null)
const searchString = ref('')
const showUserDeleteDialog = ref(false)
const showChangeUserRoleDialog = ref(false)

const { triggerNotification } = useGlobalToast()

const openUserDeleteDialog = (user: User) => {
  userToModify.value = user
  showUserDeleteDialog.value = true
}

const closeUserDeleteDialog = () => {
  showUserDeleteDialog.value = false
}

// const openChangeUserRoleDialog = (user: User) => {
//   userToModify.value = user
//   showChangeUserRoleDialog.value = true
// }

const closeChangeUserRoleDialog = () => {
  showChangeUserRoleDialog.value = false
}

const adminDeleteUser = graphql(`
  mutation Mutation($userConfirmation: UserDeleteInput!) {
    adminDeleteUser(userConfirmation: $userConfirmation)
  }
`)

const { mutate: adminDeleteUserMutation } = useMutation(adminDeleteUser)

const deleteConfirmed = async () => {
  try {
    if (userToModify.value && userToModify.value.email) {
      await adminDeleteUserMutation({
        userConfirmation: { email: userToModify.value.email }
      })
      closeUserDeleteDialog()
      refetchUsers()
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'User deleted',
        description: 'The user has been succesfully deleted'
      })
    } else {
      console.error('userToModify.value or userToModify.value.email is not defined')
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Error',
        description: 'Failed to delete user'
      })
    }
  } catch (error) {
    console.error('Failed to delete user', error)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Error',
      description: 'Failed to delete user'
    })
  }
}

const changeUserRoleConfirmed = () => {
  // Implement actual change role logic here
  showChangeUserRoleDialog.value = false
  userToModify.value = null
}

const handleSearchChange = (newSearchString: string) => {
  searchUpdateHandler(newSearchString)
}

const getUsers = graphql(`
  query UserList($limit: Int!, $cursor: String, $query: String) {
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

const logger = useLogger()

const infiniteLoaderId = ref('')
const {
  result: extraPagesResult,
  fetchMore: fetchMorePages,
  variables: resultVariables,
  onResult,
  refetch: refetchUsers
} = useQuery(getUsers, () => ({
  limit: 50,
  query: searchString.value
}))

const moreToLoad = computed(
  () =>
    !extraPagesResult.value?.admin?.userList ||
    extraPagesResult.value.admin.userList.items.length <
      extraPagesResult.value.admin.userList.totalCount
)

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

const users = computed(() => extraPagesResult.value?.admin.userList.items || [])

const searchUpdateHandler = (value: string) => {
  searchString.value = value
}

const debounceSearchUpdate = debounce(searchUpdateHandler, 500)

const calculateLoaderId = () => {
  infiniteLoaderId.value = resultVariables.value?.query || ''
}

onResult(calculateLoaderId)
</script>
