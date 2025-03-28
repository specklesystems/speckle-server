<template>
  <LayoutDialog v-model:open="open" max-width="sm" :buttons="dialogButtons">
    <template #header>{{ title }}</template>
    <div class="flex flex-col mb-4">
      <p class="text-body-sm mb-4">Confirm {{ user.name }}'s new seat.</p>

      <SeatTransitionCards
        :is-upgrading="isUpgrading"
        :is-free-plan="isFreePlan"
        :has-available-seat="editorSeats.hasSeatAvailable"
        :seat-price="editorSeats.seatPrice"
      />

      <p v-if="billingMessage" class="text-foreground-2 text-body-xs mt-4">
        {{ billingMessage }}
      </p>

      <NuxtLink
        :to="LearnMoreRolesSeatsUrl"
        class="text-foreground-2 text-body-xs underline mt-3"
      >
        Learn more about seats
      </NuxtLink>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import type { UserItem } from '~/components/settings/workspaces/members/new/MembersTable.vue'
import {
  SeatTypes,
  type WorkspaceSeatType,
  type MaybeNullOrUndefined
} from '@speckle/shared'
import { useWorkspaceUpdateSeatType } from '~/lib/workspaces/composables/management'
import { useWorkspacePlan } from '~/lib/workspaces/composables/plan'
import { LearnMoreRolesSeatsUrl } from '~/lib/common/helpers/route'
import SeatTransitionCards from './SeatTransitionCards.vue'
import type {
  SettingsWorkspacesMembersNewGuestsTable_WorkspaceFragment,
  SettingsWorkspacesNewMembersTable_WorkspaceFragment
} from '~/lib/common/generated/gql/graphql'

const props = defineProps<{
  user: UserItem
  workspace?: MaybeNullOrUndefined<
    | SettingsWorkspacesNewMembersTable_WorkspaceFragment
    | SettingsWorkspacesMembersNewGuestsTable_WorkspaceFragment
  >
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const open = defineModel<boolean>('open', { required: true })

const updateUserSeatType = useWorkspaceUpdateSeatType()
const {
  editorSeats,
  totalCostFormatted,
  billingCycleEnd,
  isPurchasablePlan,
  isFreePlan
} = useWorkspacePlan(props.workspace?.slug || '')

const isUpgrading = computed(() => props.user.seatType === SeatTypes.Viewer)

const billingMessage = computed(() => {
  if (isFreePlan.value) return null
  if (isUpgrading.value) {
    return editorSeats.value.hasSeatAvailable
      ? 'You have an unused Editor seat that is already paid for, so the change will not incur any charges.'
      : `This adds an extra Editor seat to your subscription, increasing your total billing to ${totalCostFormatted.value}/month.`
  } else {
    return isPurchasablePlan.value
      ? `The Editor seat will still be paid for until your plan renews on ${billingCycleEnd.value}. You can freely reassign it to another person.`
      : null
  }
})

const title = computed(() => {
  return isUpgrading.value ? 'Upgrade to an Editor seat?' : 'Downgrade to a viewer seat'
})

const handleConfirm = async () => {
  if (!props.workspace?.id) return

  const newSeatType: WorkspaceSeatType = isUpgrading.value
    ? SeatTypes.Editor
    : SeatTypes.Viewer

  await updateUserSeatType({
    userId: props.user.id,
    seatType: newSeatType,
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
    text: isUpgrading.value ? 'Confirm and upgrade' : 'Confirm and downgrade',
    props: {
      color: 'primary'
    },
    onClick: handleConfirm
  }
])
</script>
