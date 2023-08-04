<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink
        :to="'/server-management'"
        name="Server Management"
      ></HeaderNavLink>
      <HeaderNavLink
        :to="'/server-management/pending-invitations/'"
        name="Pending Invitations"
      ></HeaderNavLink>
    </Portal>

    <div
      class="flex flex-col md:flex-row space-y-2 space-x-2 justify-between mb-4 md:items-center h-8"
    >
      <div>
        <h5 class="h4 font-bold">Pending Invitations</h5>
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
        { id: 'email', title: 'Email' },
        { id: 'invitedBy', title: 'Invited By' },
        { id: 'resend', title: '' }
      ]"
      :items="users"
      :buttons="[
        { icon: TrashIcon, label: 'Delete', action: openDeleteInvitationDialog }
      ]"
      :column-classes="{
        email: 'col-span-5',
        invitedBy: 'col-span-4',
        resend: 'col-span-3'
      }"
    >
      <template #email="{ item }">
        {{ item.email }}
      </template>

      <template #invitedBy="{ item }">
        <div class="flex items-center gap-2">
          <img
            :src="item.profilePicture"
            :alt="'Profile picture of ' + item.invitedBy"
            class="w-6 h-6 rounded-full"
          />
          {{ item.invitedBy }}
        </div>
      </template>

      <template #resend="{ item }">
        <button class="font-semibold text-primary" @click="resendInvitation(item)">
          Resend Invitation
        </button>
      </template>
    </Table>

    <DeleteInvitationDialog
      v-model:open="showDeleteInvitationDialog"
      :user="user ?? userToModify"
      title="Delete Invitation"
      :buttons="[
        {
          text: 'Delete',
          props: { color: 'danger', fullWidth: true },
          onClick: deleteConfirmed
        },
        {
          text: 'Cancel',
          props: { color: 'secondary', fullWidth: true, outline: true },
          onClick: closeDeleteInvitationDialog
        }
      ]"
    />
  </div>
</template>

<script setup lang="ts">
import {
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/vue/20/solid'

import Table from '../../components/server-management/Table.vue'
import DeleteInvitationDialog from '../../components/server-management/DeleteInvitationDialog.vue'

import { TrashIcon } from '@heroicons/vue/24/outline'

const userToModify = ref<User | null>(null)

const openDeleteInvitationDialog = (user: User) => {
  userToModify.value = user
  showDeleteInvitationDialog.value = true
}

const closeDeleteInvitationDialog = () => {
  userToModify.value = null
  showDeleteInvitationDialog.value = false
}

const deleteConfirmed = () => {
  // Implement actual delete logic here
  console.log('Deleting user:', userToModify.value)
  showDeleteInvitationDialog.value = false
  userToModify.value = null
}

const resendInvitation = (item) => {
  console.log(item)
}

const showDeleteInvitationDialog = ref(false)

export interface User {
  id: string
  invitedBy: string
  profilePicture: string
  email: string
}

const users: User[] = [
  {
    id: '1',
    invitedBy: 'John Doe',
    profilePicture: 'https://randomuser.me/api/portraits/men/75.jpg',
    email: 'johndoe@example.com'
  },
  {
    id: '2',
    invitedBy: 'Jane Doe',
    profilePicture: 'https://randomuser.me/api/portraits/women/75.jpg',
    email: 'janedoe@example.com'
  },
  {
    id: '3',
    invitedBy: 'Bob Smith',
    profilePicture: 'https://randomuser.me/api/portraits/men/76.jpg',
    email: 'bobsmith@example.com'
  },
  {
    id: '4',
    invitedBy: 'Alice Johnson',
    profilePicture: 'https://randomuser.me/api/portraits/women/76.jpg',
    email: 'alicejohnson@example.com'
  },
  {
    id: '5',
    invitedBy: 'David Lee',
    profilePicture: 'https://randomuser.me/api/portraits/men/77.jpg',
    email: 'davidlee@example.com'
  },
  {
    id: '6',
    invitedBy: 'Samantha Brown',
    profilePicture: 'https://randomuser.me/api/portraits/women/77.jpg',
    email: 'samanthabrown@example.com'
  },
  {
    id: '7',
    invitedBy: 'Mike Johnson',
    profilePicture: 'https://randomuser.me/api/portraits/men/78.jpg',
    email: 'mikejohnson@example.com'
  },
  {
    id: '8',
    invitedBy: 'Emily Davis',
    profilePicture: 'https://randomuser.me/api/portraits/women/78.jpg',
    email: 'emilydavis@example.com'
  },
  {
    id: '9',
    invitedBy: 'Steven Chen',
    profilePicture: 'https://randomuser.me/api/portraits/men/79.jpg',
    email: 'stevenchen@example.com'
  },
  {
    id: '10',
    invitedBy: 'Grace Kim',
    profilePicture: 'https://randomuser.me/api/portraits/women/79.jpg',
    email: 'gracekim@example.com'
  },
  {
    id: '11',
    invitedBy: 'Andrew Nguyen',
    profilePicture: 'https://randomuser.me/api/portraits/men/80.jpg',
    email: 'andrenguyen@example.com'
  },
  {
    id: '12',
    invitedBy: 'Jessica Lee',
    profilePicture: 'https://randomuser.me/api/portraits/women/80.jpg',
    email: 'jessicalee@example.com'
  },
  {
    id: '13',
    invitedBy: 'Tom Wilson',
    profilePicture: 'https://randomuser.me/api/portraits/men/81.jpg',
    email: 'tomwilson@example.com'
  },
  {
    id: '14',
    invitedBy: 'Olivia Clark',
    profilePicture: 'https://randomuser.me/api/portraits/women/81.jpg',
    email: 'oliviaclark@example.com'
  },
  {
    id: '15',
    invitedBy: 'William Davis',
    profilePicture: 'https://randomuser.me/api/portraits/men/82.jpg',
    email: 'williamdavis@example.com'
  },
  {
    id: '16',
    invitedBy: 'Sophia Rodriguez',
    profilePicture: 'https://randomuser.me/api/portraits/women/82.jpg',
    email: 'sophiarodriguez@example.com'
  },
  {
    id: '17',
    invitedBy: 'Daniel Kim',
    profilePicture: 'https://randomuser.me/api/portraits/men/83.jpg',
    email: 'danielkim@example.com'
  },
  {
    id: '18',
    invitedBy: 'Ava Wilson',
    profilePicture: 'https://randomuser.me/api/portraits/women/83.jpg',
    email: 'avawilson@example.com'
  },
  {
    id: '19',
    invitedBy: 'Kevin Lee',
    profilePicture: 'https://randomuser.me/api/portraits/men/84.jpg',
    email: 'kevinlee@example.com'
  },
  {
    id: '20',
    invitedBy: 'Isabella Martinez',
    profilePicture: 'https://randomuser.me/api/portraits/women/84.jpg',
    email: 'isabellamartinez@example.com'
  }
]
</script>
