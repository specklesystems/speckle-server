<template>
  <LayoutDialog v-model:open="open" max-width="sm" :buttons="dialogButtons">
    <template #header>{{ title }}</template>
    <div class="flex flex-col mb-4">
      <p class="text-body-sm mb-4">Confirm {{ user.user.name }}'s new seat.</p>

      <SeatTransitionCards
        :is-upgrading="isUpgrading"
        :is-free-plan="isFreePlan"
        :is-unlimited-plan="isUnlimitedPlan"
        :is-guest="user.role === Roles.Workspace.Guest"
        :has-available-seat="hasAvailableEditorSeats"
        :seat-price="editorSeatPriceFormatted"
        :billing-interval="intervalIsYearly ? 'yearly' : 'monthly'"
      />

      <p v-if="billingMessage" class="text-foreground-2 text-body-xs mt-4">
        {{ billingMessage }}
      </p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import type { LayoutDialogButton } from '@speckle/ui-components'
import {
  SeatTypes,
  type WorkspaceSeatType,
  type MaybeNullOrUndefined
} from '@speckle/shared'
import { useWorkspaceUpdateSeatType } from '~/lib/workspaces/composables/management'
import { useWorkspacePlan } from '~/lib/workspaces/composables/plan'
import SeatTransitionCards from './SeatTransitionCards.vue'
import type {
  SettingsWorkspacesMembersActionsMenu_UserFragment,
  SettingsWorkspacesMembersTable_WorkspaceFragment
} from '~/lib/common/generated/gql/graphql'
import { Roles } from '@speckle/shared'

const props = defineProps<{
  user: SettingsWorkspacesMembersActionsMenu_UserFragment
  workspace?: MaybeNullOrUndefined<SettingsWorkspacesMembersTable_WorkspaceFragment>
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const open = defineModel<boolean>('open', { required: true })

const updateUserSeatType = useWorkspaceUpdateSeatType()
const {
  hasAvailableEditorSeats,
  editorSeatPriceFormatted,
  currentBillingCycleEnd,
  isPaidPlan,
  isFreePlan,
  intervalIsYearly,
  isUnlimitedPlan
} = useWorkspacePlan(props.workspace?.slug || '')

const isLoading = ref(false)

const isUpgrading = computed(() => props.user.seatType === SeatTypes.Viewer)
const annualOrMonthly = computed(() => (intervalIsYearly.value ? 'year' : 'month'))

const billingMessage = computed(() => {
  if (isFreePlan.value) return null
  if (isUpgrading.value) {
    return hasAvailableEditorSeats.value
      ? 'You have an unused Editor seat that is already paid for, so the change will not incur any charges.'
      : `You'll be charged immediately for the partial period from today until your plan renewal on ${dayjs(
          currentBillingCycleEnd.value
        ).format('DD-MM-YYYY')} (${editorSeatPriceFormatted.value}/${
          annualOrMonthly.value
        } adjusted for the remaining time).`
  } else {
    return isPaidPlan.value
      ? `The Editor seat will still be paid for until your plan renews on ${dayjs(
          currentBillingCycleEnd.value
        ).format('DD-MM-YYYY')}. You can freely reassign it to another person.`
      : null
  }
})

const title = computed(() => {
  return isUpgrading.value ? 'Upgrade to an Editor seat?' : 'Downgrade to a viewer seat'
})

const handleConfirm = async () => {
  if (!props.workspace?.id) return

  isLoading.value = true

  try {
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
  } finally {
    isLoading.value = false
  }
}

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => (open.value = false)
  },
  {
    text: isUpgrading.value
      ? hasAvailableEditorSeats.value || !isPaidPlan.value
        ? 'Upgrade seat'
        : 'Confirm and pay'
      : 'Downgrade seat',
    props: {
      color: 'primary',
      loading: isLoading.value
    },
    onClick: handleConfirm
  }
])
</script>
