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
        v-model="searchString"
        size="lg"
        name="search"
        :custom-icon="MagnifyingGlassIcon"
        color="foundation"
        full-width
        search
        :show-clear="!!searchString"
        placeholder="Search Users"
        class="rounded-md border border-outline-3"
      />
      <div class="flex items-center gap-2 text-foreground text-sm shrink-0">
        <span class="shrink-0">1-50 of 350</span>
        <div class="flex gap-1">
          <ChevronLeftIcon class="h-8 w-8" />
          <ChevronRightIcon class="h-8 w-8" />
        </div>
      </div>
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
  ChevronLeftIcon,
  ChevronRightIcon,
  ShieldExclamationIcon,
  ShieldCheckIcon
} from '@heroicons/vue/20/solid'

import Table from '../../components/server-management/Table.vue'
import UserRoleSelect from '../../components/server-management/UserRoleSelect.vue'
import UserDeleteDialog from '../../components/server-management/DeleteUserDialog.vue'
import ChangeUserRoleDialog from '../../components/server-management/ChangeUserRoleDialog.vue'
import { ref } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import Avatar from '~~/components/user/Avatar.vue'

import { TrashIcon } from '@heroicons/vue/24/outline'

const userToModify = ref<User | null>(null)

const openUserDeleteDialog = (user: User) => {
  userToModify.value = user
  showUserDeleteDialog.value = true
}

const closeUserDeleteDialog = () => {
  showUserDeleteDialog.value = false
}

const openChangeUserRoleDialog = (user: User) => {
  userToModify.value = user
  showChangeUserRoleDialog.value = true
}

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

const GET_USERS = gql`
  query ServerStatistics(
    $role: ServerRole
    $query: String
    $cursor: String
    $limit: Int!
  ) {
    admin {
      userList(role: $role, query: $query, cursor: $cursor, limit: $limit) {
        totalCount
        items {
          id
          name
          avatar
          verified
          company
          role
        }
        cursor
      }
    }
  }
`

const { result } = useQuery(GET_USERS, {
  limit: 50
})

const users = ref<User[]>([])

watchEffect(() => {
  if (result.value) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    users.value = result.value.admin.userList.items
  }
})

// Watch for changes in the 'role' of each user
users.value.forEach((user) => {
  watch(
    () => user.role,
    (newRole, oldRole) => {
      if (newRole !== oldRole) {
        userToModify.value = user // Set the current user to modify
        openChangeUserRoleDialog(user) // Open the dialog
      }
    }
  )
})
</script>
