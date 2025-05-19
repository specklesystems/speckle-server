<template>
  <LayoutDialog
    v-model:open="open"
    max-width="sm"
    :buttons="dialogButtons"
    @update:open="(v) => !v && emit('cancel')"
  >
    <template #header>{{ title }}</template>
    <div class="flex flex-col mb-4">
      <p class="text-body-sm mb-4">
        {{ text || `Confirm ${user.user.name}'s new seat.` }}
      </p>

      <SeatTransitionCards
        :is-upgrading="isUpgrading"
        :is-free-plan="isFreePlan"
        :is-unlimited-plan="isUnlimitedPlan"
        :is-guest="user.role === Roles.Workspace.Guest"
        :has-available-seat="hasAvailableEditorSeats"
        :seat-price="editorSeatPriceFormatted"
        :billing-interval="intervalIsYearly ? 'year' : 'month'"
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
import type { SettingsWorkspacesMembersTableHeader_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import { Roles } from '@speckle/shared'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'

const workspaceAvailableEditorSeatsQuery = graphql(`
  query WorkspaceAvailableEditorSeats($slug: String!) {
    workspaceBySlug(slug: $slug) {
      id
      seats {
        editors {
          available
        }
      }
    }
  }
`)

type UpgradeSeatTypeDialogUser = {
  id: string
  role: string
  seatType?: WorkspaceSeatType | null
  user: {
    name: string
  }
}

const props = defineProps<{
  text?: string
  hideNotifications?: boolean
  user: UpgradeSeatTypeDialogUser
  workspace?: MaybeNullOrUndefined<SettingsWorkspacesMembersTableHeader_WorkspaceFragment>
}>()

const emit = defineEmits<{
  (e: 'success'): void
  (e: 'cancel'): void
}>()

const open = defineModel<boolean>('open', { required: true })

const mixpanel = useMixpanel()
const updateUserSeatType = useWorkspaceUpdateSeatType()
const {
  editorSeatPriceFormatted,
  currentBillingCycleEnd,
  isPaidPlan,
  isFreePlan,
  intervalIsYearly,
  isUnlimitedPlan
} = useWorkspacePlan(props.workspace?.slug || '')

const { result: seatsResult, refetch: refetchSeats } = useQuery(
  workspaceAvailableEditorSeatsQuery,
  () => ({ slug: props.workspace?.slug || '' }),
  () => ({ enabled: !!props.workspace?.slug })
)

const hasAvailableEditorSeats = computed(() => {
  const editors = seatsResult.value?.workspaceBySlug?.seats?.editors
  return editors?.available ? editors.available > 0 : false
})

const isLoading = ref(false)

const isUpgrading = computed(() => props.user.seatType === SeatTypes.Viewer)

const billingMessage = computed(() => {
  if (isFreePlan.value) return null
  if (isUpgrading.value) {
    return hasAvailableEditorSeats.value
      ? 'You have an unused Editor seat that is already paid for, so the change will not incur any charges.'
      : `You will be charged an adjusted amount for the partial period from today until your plan renewal on ${dayjs(
          currentBillingCycleEnd.value
        ).format('MMMM D, YYYY')}.`
  } else {
    return isPaidPlan.value
      ? `The Editor seat will still be paid for until your plan renews on ${dayjs(
          currentBillingCycleEnd.value
        ).format('MMMM D, YYYY')}. You can freely reassign it to another person.`
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

    await updateUserSeatType(
      {
        userId: props.user.id,
        seatType: newSeatType,
        workspaceId: props.workspace.id
      },
      { hideNotifications: props.hideNotifications }
    )

    if (!hasAvailableEditorSeats.value && isPaidPlan.value) {
      mixpanel.track('Workspace Seat Purchased', {
        location: 'upgrade_seat_type_dialog',
        seatType: 'editor',
        // eslint-disable-next-line camelcase
        workspace_id: props.workspace.id
      })
    }

    await refetchSeats()

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
    onClick: () => {
      open.value = false
      emit('cancel')
    }
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
