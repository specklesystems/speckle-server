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
          <img
            :src="item.profilePicture"
            :alt="'Profile picture of ' + item.name"
            class="w-6 h-6 rounded-full"
          />
          {{ item.name }}
        </div>
      </template>

      <template #email="{ item }">
        {{ item.email }}
      </template>

      <template #emailState="{ item }">
        <div class="flex items-center gap-2">
          <template v-if="item.emailState === 'verified'">
            <ShieldExclamationIcon class="h-4 w-4 text-danger" />
          </template>
          <template v-else>
            <ShieldCheckIcon class="h-4 w-4 text-primary" />
          </template>
          {{ item.emailState }}
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
  profilePicture: string
  email: string
  emailState: 'verified' | 'not verified'
  company: string
  role: 'user' | 'admin' | 'archive'
  invitedBy?: User
}

const users: User[] = [
  {
    id: '1',
    name: 'John Doe',
    profilePicture: 'https://randomuser.me/api/portraits/men/75.jpg',
    email: 'johndoe@example.com',
    emailState: 'verified',
    company: 'Acme',
    role: 'admin'
  },
  {
    id: '2',
    name: 'Jane Doe',
    profilePicture: 'https://randomuser.me/api/portraits/women/75.jpg',
    email: 'janedoe@example.com',
    emailState: 'not verified',
    company: 'Acme',
    role: 'user'
  },
  {
    id: '3',
    name: 'Bob Smith',
    profilePicture: 'https://randomuser.me/api/portraits/men/76.jpg',
    email: 'bobsmith@example.com',
    emailState: 'verified',
    company: 'ABC Inc.',
    role: 'admin'
  },
  {
    id: '4',
    name: 'Alice Johnson',
    profilePicture: 'https://randomuser.me/api/portraits/women/76.jpg',
    email: 'alicejohnson@example.com',
    emailState: 'not verified',
    company: 'ABC Inc.',
    role: 'user'
  },
  {
    id: '5',
    name: 'David Lee',
    profilePicture: 'https://randomuser.me/api/portraits/men/77.jpg',
    email: 'davidlee@example.com',
    emailState: 'verified',
    company: 'XYZ Corp.',
    role: 'admin'
  },
  {
    id: '6',
    name: 'Samantha Brown',
    profilePicture: 'https://randomuser.me/api/portraits/women/77.jpg',
    email: 'samanthabrown@example.com',
    emailState: 'not verified',
    company: 'XYZ Corp.',
    role: 'user'
  },
  {
    id: '7',
    name: 'Mike Johnson',
    profilePicture: 'https://randomuser.me/api/portraits/men/78.jpg',
    email: 'mikejohnson@example.com',
    emailState: 'verified',
    company: 'Acme',
    role: 'admin'
  },
  {
    id: '8',
    name: 'Emily Davis',
    profilePicture: 'https://randomuser.me/api/portraits/women/78.jpg',
    email: 'emilydavis@example.com',
    emailState: 'not verified',
    company: 'Acme',
    role: 'user'
  },
  {
    id: '9',
    name: 'Steven Chen',
    profilePicture: 'https://randomuser.me/api/portraits/men/79.jpg',
    email: 'stevenchen@example.com',
    emailState: 'verified',
    company: 'ABC Inc.',
    role: 'admin'
  },
  {
    id: '10',
    name: 'Grace Kim',
    profilePicture: 'https://randomuser.me/api/portraits/women/79.jpg',
    email: 'gracekim@example.com',
    emailState: 'not verified',
    company: 'ABC Inc.',
    role: 'user'
  },
  {
    id: '11',
    name: 'Andrew Nguyen',
    profilePicture: 'https://randomuser.me/api/portraits/men/80.jpg',
    email: 'andrenguyen@example.com',
    emailState: 'verified',
    company: 'XYZ Corp.',
    role: 'admin'
  },
  {
    id: '12',
    name: 'Jessica Lee',
    profilePicture: 'https://randomuser.me/api/portraits/women/80.jpg',
    email: 'jessicalee@example.com',
    emailState: 'not verified',
    company: 'XYZ Corp.',
    role: 'user'
  },
  {
    id: '13',
    name: 'Tom Wilson',
    profilePicture: 'https://randomuser.me/api/portraits/men/81.jpg',
    email: 'tomwilson@example.com',
    emailState: 'verified',
    company: 'Acme',
    role: 'admin'
  },
  {
    id: '14',
    name: 'Olivia Clark',
    profilePicture: 'https://randomuser.me/api/portraits/women/81.jpg',
    email: 'oliviaclark@example.com',
    emailState: 'not verified',
    company: 'Acme',
    role: 'user'
  },
  {
    id: '15',
    name: 'William Davis',
    profilePicture: 'https://randomuser.me/api/portraits/men/82.jpg',
    email: 'williamdavis@example.com',
    emailState: 'verified',
    company: 'ABC Inc.',
    role: 'admin'
  },
  {
    id: '16',
    name: 'Sophia Rodriguez',
    profilePicture: 'https://randomuser.me/api/portraits/women/82.jpg',
    email: 'sophiarodriguez@example.com',
    emailState: 'not verified',
    company: 'ABC Inc.',
    role: 'user'
  },
  {
    id: '17',
    name: 'Daniel Kim',
    profilePicture: 'https://randomuser.me/api/portraits/men/83.jpg',
    email: 'danielkim@example.com',
    emailState: 'verified',
    company: 'XYZ Corp.',
    role: 'admin'
  },
  {
    id: '18',
    name: 'Ava Wilson',
    profilePicture: 'https://randomuser.me/api/portraits/women/83.jpg',
    email: 'avawilson@example.com',
    emailState: 'not verified',
    company: 'XYZ Corp.',
    role: 'user'
  },
  {
    id: '19',
    name: 'Kevin Lee',
    profilePicture: 'https://randomuser.me/api/portraits/men/84.jpg',
    email: 'kevinlee@example.com',
    emailState: 'verified',
    company: 'Acme',
    role: 'admin'
  },
  {
    id: '20',
    name: 'Isabella Martinez',
    profilePicture: 'https://randomuser.me/api/portraits/women/84.jpg',
    email: 'isabellamartinez@example.com',
    emailState: 'not verified',
    company: 'Acme',
    role: 'user'
  }
]

// Watch for changes in the 'role' of each user
users.forEach((user) => {
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
