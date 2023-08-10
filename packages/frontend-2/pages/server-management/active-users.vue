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

    <div
      class="flex flex-col md:flex-row space-y-2 space-x-2 justify-between mb-4 md:items-center h-8"
    >
      <div>
        <h5 class="h4 font-bold">Active Users</h5>
      </div>
    </div>

    <div class="flex items-center gap-8 h-10">
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
        @change="($event) => searchUpdateHandler($event.value)"
      />
    </div>

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
import {
  MagnifyingGlassIcon,
  ShieldExclamationIcon,
  ShieldCheckIcon
} from '@heroicons/vue/20/solid'

import Table from '../../components/server-management/Table.vue'
import UserRoleSelect from '../../components/server-management/UserRoleSelect.vue'
import UserDeleteDialog from '../../components/server-management/DeleteUserDialog.vue'
import ChangeUserRoleDialog from '../../components/server-management/ChangeUserRoleDialog.vue'
import { InfiniteLoaderState } from '~~/lib/global/helpers/components'
import { ref } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~~/lib/common/generated/gql'
import { debounce } from 'lodash-es'

import Avatar from '~~/components/user/Avatar.vue'

import { TrashIcon } from '@heroicons/vue/24/outline'

const userToModify = ref<User | null>(null)
const searchString = ref('')

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

const deleteConfirmed = () => {
  // Implement actual delete logic here
  console.log('Deleting user:', userToModify.value)
  showUserDeleteDialog.value = false
  userToModify.value = null
}

const changeUserRoleConfirmed = () => {
  // Implement actual change role logic here
  console.log('Chaning Role:', userToModify.value)
  showChangeUserRoleDialog.value = false
  userToModify.value = null
}

const showUserDeleteDialog = ref(false)
const showChangeUserRoleDialog = ref(false)

export interface User {
  id: string
  name: string
  avatar: string
  email: string
  emailState: boolean
  verified: boolean
  company: string
  role: 'user' | 'admin' | 'archive'
  invitedBy?: User
}

const getUsers = graphql(`
  query UserList($limit: Int!, $cursor: String, $query: String) {
    admin {
      userList(limit: $limit, cursor: $cursor, query: $query) {
        totalCount
        cursor
        items {
          id
          bio
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
  onResult
} = useQuery(getUsers, () => ({
  limit: 50,
  query: searchString.value
}))

// const hasItems = computed(
//   () => !!(extraPagesResult.value?.admin?.userList?.items || []).length
// )

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

// Watch for changes in the 'role' of each user
// users.value.forEach((user) => {
//   watch(
//     () => user.role,
//     (newRole, oldRole) => {
//       if (newRole !== oldRole) {
//         userToModify.value = user // Set the current user to modify
//         openChangeUserRoleDialog(user) // Open the dialog
//       }
//     }
//   )
// })
</script>
