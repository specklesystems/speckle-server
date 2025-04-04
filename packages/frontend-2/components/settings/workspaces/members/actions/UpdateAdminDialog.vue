<template>
  <LayoutDialog v-model:open="open" max-width="sm" :buttons="dialogButtons">
    <template #header>{{ title }}</template>
    <CommonAlert
      v-if="isOnlyAdmin && props.action === 'resign'"
      color="danger"
      hide-icon
      size="xs"
    >
      <template #title>You are the only admin of this workspace</template>
      <template #description>
        <span class="text-body-2xs">
          Please transfer the admin role to another user before leaving the workspace.
        </span>
      </template>
    </CommonAlert>
    <div v-else class="flex flex-col gap-4 mb-4 -mt-1">
      <CommonCard class="bg-foundation-2 text-body-2xs !p-2">
        <div class="flex flex-row gap-x-2 items-center">
          <UserAvatar
            hide-tooltip
            :user="user"
            light-style
            class="bg-foundation"
            no-bg
          />
          {{ user.name }}
        </div>
      </CommonCard>

      <p class="text-body-sm">
        {{ mainMessage }}
      </p>

      <template v-if="needsEditorUpgrade">
        <CommonCard class="!py-3">
          <p class="text-body-xs font-medium text-foreground">Seat purchase required</p>
          <p class="text-body-2xs text-foreground mb-4">
            All admins need to be on a paid Editor seat.
          </p>
          <SeatTransitionCards
            :is-upgrading="true"
            :is-free-plan="isFreePlan"
            :has-available-seat="editorSeats.hasSeatAvailable"
            :seat-price="editorSeats.seatPrice"
          />
        </CommonCard>
      </template>

      <p class="text-foreground-2 text-body-2xs">
        {{ roleInfo }} Learn more about
        <NuxtLink
          :to="LearnMoreRolesSeatsUrl"
          target="_blank"
          class="text-foreground-2 underline"
        >
          workspace roles.
        </NuxtLink>
      </p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import type { UserItem } from '~/components/settings/workspaces/members/MembersTable.vue'
import { LearnMoreRolesSeatsUrl } from '~/lib/common/helpers/route'
import { Roles, SeatTypes } from '@speckle/shared'
import { WorkspaceRoleDescriptions } from '~/lib/settings/helpers/constants'
import { useWorkspaceUpdateRole } from '~/lib/workspaces/composables/management'
import { useWorkspacePlan } from '~/lib/workspaces/composables/plan'
import SeatTransitionCards from './SeatTransitionCards.vue'
import type {
  SettingsWorkspacesMembersGuestsTable_WorkspaceFragment,
  SettingsWorkspacesMembersTable_WorkspaceFragment
} from '~/lib/common/generated/gql/graphql'
import type { MaybeNullOrUndefined } from '@speckle/shared'

const props = defineProps<{
  user: UserItem
  workspace?: MaybeNullOrUndefined<
    | SettingsWorkspacesMembersTable_WorkspaceFragment
    | SettingsWorkspacesMembersGuestsTable_WorkspaceFragment
  >
  isActiveUserTargetUser: boolean
  isOnlyAdmin: boolean
  action?: 'make' | 'remove' | 'resign'
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const open = defineModel<boolean>('open', { required: true })

const updateUserRole = useWorkspaceUpdateRole()
const { editorSeats, isFreePlan } = useWorkspacePlan(props.workspace?.slug || '')

const needsEditorUpgrade = computed(() => {
  return props.action === 'make' && props.user.seatType === SeatTypes.Viewer
})

const title = computed(() => {
  switch (props.action) {
    case 'make':
      return 'Make an admin?'
    case 'remove':
      return 'Remove admin?'
    case 'resign':
      return 'Resign as admin?'
    default:
      return ''
  }
})

const buttonText = computed(() => {
  switch (props.action) {
    case 'make':
      return needsEditorUpgrade.value ? 'Upgrade and make admin' : 'Make an admin'
    case 'remove':
      return 'Remove admin'
    case 'resign':
      return 'Become a member'
    default:
      return ''
  }
})

const mainMessage = computed(() => {
  switch (props.action) {
    case 'make':
      return 'They will be able to manage the full workspace, including settings, members, and all projects.'
    case 'remove':
      return 'They will be able to create and own projects, but will no longer have admin privileges.'
    case 'resign':
      return 'You will no longer be able to manage workspace settings, members, or billing. You will still be able to create and own projects as a member.'
    default:
      return ''
  }
})

const roleInfo = computed(() => {
  return props.action === 'make'
    ? WorkspaceRoleDescriptions[Roles.Workspace.Admin]
    : WorkspaceRoleDescriptions[Roles.Workspace.Member]
})

const handleConfirm = async () => {
  if (!props.workspace?.id) return

  await updateUserRole({
    userId: props.user.id,
    role: props.action === 'make' ? Roles.Workspace.Admin : Roles.Workspace.Member,
    workspaceId: props.workspace.id
  })

  open.value = false
  emit('success')
}

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => (open.value = false)
  },
  {
    text: buttonText.value,
    props: {
      color: 'primary',
      disabled: props.isOnlyAdmin && props.action === 'resign'
    },
    onClick: handleConfirm
  }
])
</script>
