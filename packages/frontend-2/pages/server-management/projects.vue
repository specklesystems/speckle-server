<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink
        :to="'/server-management'"
        name="Server Management"
      ></HeaderNavLink>
      <HeaderNavLink
        :to="'/server-management/projects/'"
        name="Projects"
      ></HeaderNavLink>
    </Portal>

    <div
      class="flex flex-col md:flex-row space-y-2 space-x-2 justify-between mb-4 md:items-center h-8"
    >
      <div>
        <h5 class="h4 font-bold">Projects</h5>
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
      <div>FILTER</div>
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
        { id: 'type', title: 'Type' },
        { id: 'created', title: 'Created' },
        { id: 'modified', title: 'Modified' },
        { id: 'models', title: 'Models' },
        { id: 'versions', title: 'Versions' },
        { id: 'contributors', title: 'Contributors' }
      ]"
      :items="users"
      :buttons="[
        { icon: TrashIcon, label: 'Delete', action: openDeleteInvitationDialog }
      ]"
      :column-classes="{
        name: 'col-span-3',
        type: 'col-span-1',
        created: 'col-span-2',
        modified: 'col-span-2',
        models: 'col-span-1',
        versions: 'col-span-1',
        contributors: 'col-span-1'
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
import { User } from './active-users.vue'

import { TrashIcon } from '@heroicons/vue/24/outline'

export interface Project {
  id: string
  name: string
  type: 'private' | 'public'
  created: Date
  modified: Date
  models: number
  versions: number
  contributors: User[]
}
</script>
