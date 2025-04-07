<template>
  <LayoutDialog v-model:open="open" max-width="sm" :buttons="dialogButtons">
    <template #header>{{ title }}</template>
    <div class="flex flex-col gap-4 mb-4 -mt-1">
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
          <p class="text-body-xs font-medium text-foreground">
            {{
              isFreePlan || isUnlimitedPlan
                ? 'Seat upgrade required'
                : 'Seat purchase required'
            }}
          </p>
          <p class="text-body-2xs text-foreground mb-4">
            All admins need to be on a paid Editor seat.
          </p>
          <SeatTransitionCards
            :is-upgrading="true"
            :is-free-plan="isFreePlan"
            :is-unlimited-plan="isUnlimitedPlan"
            :is-guest="false"
            :has-available-seat="hasAvailableEditorSeats"
            :seat-price="editorSeatPriceFormatted"
          />
          <p
            v-if="needsEditorUpgrade && !hasAvailableEditorSeats"
            class="text-foreground-2 text-body-xs mt-4"
          >
            You have an unused Editor seat that is already paid for, so the change will
            not incur any charges.
          </p>
          <p
            v-if="needsEditorUpgrade && !hasAvailableEditorSeats && !isUnlimitedPlan"
            class="text-foreground-2 text-body-xs mt-4"
          >
            Note that the Editor seat is a paid seat type and this change will incur
            additional charges to your subscription.
          </p>
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

      <p v-if="isPurchasablePlan" class="text-foreground-2 text-body-xs mt-3">
        Note that the Editor seat is a paid seat type if your workspace is subscribed to
        one of the paid plans.
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
  action?: 'make' | 'remove'
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const open = defineModel<boolean>('open', { required: true })

const updateUserRole = useWorkspaceUpdateRole()
const {
  hasAvailableEditorSeats,
  isFreePlan,
  isUnlimitedPlan,
  isPurchasablePlan,
  editorSeatPriceFormatted
} = useWorkspacePlan(props.workspace?.slug || '')

const needsEditorUpgrade = computed(() => {
  return props.action === 'make' && props.user.seatType === SeatTypes.Viewer
})

const title = computed(() => {
  switch (props.action) {
    case 'make':
      return 'Make an admin?'
    case 'remove':
      return 'Revoke admin access?'
    default:
      return ''
  }
})

const buttonText = computed(() => {
  switch (props.action) {
    case 'make':
      return needsEditorUpgrade.value ? 'Upgrade and make admin' : 'Make an admin'
    case 'remove':
      return 'Revoke admin access'
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
    default:
      return ''
  }
})

const roleInfo = computed(() => {
  return props.action === 'make'
    ? undefined
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
      color: 'primary'
    },
    onClick: handleConfirm
  }
])
</script>
