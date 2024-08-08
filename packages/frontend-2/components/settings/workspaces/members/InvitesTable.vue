<template>
  <div>
    <SettingsWorkspacesMembersTableHeader
      search-placeholder="Search pending invites..."
    />
    <LayoutTable
      class="mt-6 md:mt-8"
      :columns="[
        { id: 'name', header: 'Name', classes: 'col-span-3' },
        { id: 'invitedBy', header: 'Invited by', classes: 'col-span-4' },
        { id: 'role', header: 'Role', classes: 'col-span-2' },
        { id: 'lastRemindedOn', header: 'Last reminded on', classes: 'col-span-3' }
      ]"
      :buttons="buttons"
      :items="invites"
    >
      <template #name="{ item }">
        <div class="flex items-center gap-2">
          <UserAvatar v-if="item.user" :user="item.user" />
          <span class="truncate text-body-xs text-foreground">{{ item.title }}</span>
        </div>
      </template>
      <template #invitedBy="{ item }">
        <div class="flex items-center gap-2">
          <UserAvatar v-if="item.invitedBy" :user="item.invitedBy" />
          <span class="truncate text-body-xs text-foreground">{{ item.title }}</span>
        </div>
      </template>
      <template #role="{ item }">
        <span class="text-body-xs text-foreground-2">
          {{ roleDisplayName(item.role) }}
        </span>
      </template>
      <template #lastRemindedOn="{ item }">
        <span class="text-body-xs text-foreground-2">
          {{ formattedFullDate(item.lastRemindedAt) }}
        </span>
      </template>
    </LayoutTable>
  </div>
</template>
<script setup lang="ts">
import { EnvelopeIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { capitalize } from 'lodash-es'
import { graphql } from '~/lib/common/generated/gql'
import type { SettingsWorkspacesMembersInvitesTable_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment SettingsWorkspacesMembersInvitesTable_Workspace on Workspace {
    id
    invitedTeam {
      id
      role
      title
      lastRemindedAt
      user {
        id
        ...LimitedUserAvatar
      }
      invitedBy {
        id
        ...LimitedUserAvatar
      }
    }
  }
`)

const buttons = computed(() => [
  {
    label: 'Resend invite',
    icon: EnvelopeIcon,
    action: () => ({})
  },
  {
    label: 'Delete invite',
    icon: XMarkIcon,
    action: () => ({})
  }
])

const props = defineProps<{
  workspaceId: string
  workspace?: SettingsWorkspacesMembersInvitesTable_WorkspaceFragment
}>()

const invites = computed(() => props.workspace?.invitedTeam)

const roleDisplayName = (role: string) => capitalize(role.split(':')[1])
</script>
