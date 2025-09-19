<template>
  <LayoutDialog v-model:open="open" max-width="sm" :buttons="dialogButtons">
    <template #header>{{ title }}</template>
    <div class="flex flex-col gap-4 mb-4 -mt-1">
      <CommonCard class="bg-foundation-2 text-body-2xs !p-2">
        <div class="flex flex-row gap-x-2 items-center">
          <UserAvatar
            hide-tooltip
            :user="user.user"
            light-style
            class="bg-foundation"
            no-bg
          />
          {{ user.user.name }}
        </div>
      </CommonCard>

      <p class="text-body-sm">
        {{ mainMessage }}
      </p>

      <template v-if="needsEditorUpgrade">
        <CommonCard class="!py-3">
          <p class="text-body-xs font-medium text-foreground">
            {{
              isFreePlan || hasAvailableEditorSeats || isUnlimitedPlan
                ? 'Seat change required'
                : 'Seat purchase required'
            }}
          </p>
          <p class="text-body-2xs text-foreground mb-4 mt-2">
            Admins have to be on an Editor seat.
          </p>
          <SeatTransitionCards
            :is-upgrading="true"
            :is-free-plan="isFreePlan"
            :is-unlimited-plan="isUnlimitedPlan"
            :is-guest="false"
            :has-available-seat="hasAvailableEditorSeats"
            :seat-price="editorSeatPriceFormatted"
            :billing-interval="intervalIsYearly ? 'year' : 'month'"
          />
          <template v-if="needsEditorUpgrade && !isFreePlan && !isUnlimitedPlan">
            <p
              v-if="hasAvailableEditorSeats"
              class="text-foreground-2 text-body-xs mt-4"
            >
              You have an unused Editor seat that is already paid for, so the change
              will not incur any charges.
            </p>
            <p v-else class="text-foreground-2 text-body-xs mt-4 leading-5">
              You will be charged an adjusted amount for the partial period from today
              until your plan renewal on
              {{ dayjs(currentBillingCycleEnd).format('MMMM D, YYYY') }}.
            </p>
          </template>
        </CommonCard>
      </template>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { Roles, SeatTypes } from '@speckle/shared'
import { useWorkspaceUpdateRole } from '~/lib/workspaces/composables/management'
import { useWorkspacePlan } from '~/lib/workspaces/composables/plan'
import SeatTransitionCards from './SeatTransitionCards.vue'
import type {
  SettingsWorkspacesMembersActionsMenu_UserFragment,
  SettingsWorkspacesMembersTableHeader_WorkspaceFragment
} from '~/lib/common/generated/gql/graphql'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { useMixpanel } from '~~/lib/core/composables/mp'

const props = defineProps<{
  user: SettingsWorkspacesMembersActionsMenu_UserFragment
  workspace?: MaybeNullOrUndefined<SettingsWorkspacesMembersTableHeader_WorkspaceFragment>
  isActiveUserTargetUser: boolean
  action?: 'make' | 'remove'
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const open = defineModel<boolean>('open', { required: true })

const isLoading = ref(false)

const mixpanel = useMixpanel()
const updateUserRole = useWorkspaceUpdateRole()
const {
  hasAvailableEditorSeats,
  isFreePlan,
  isUnlimitedPlan,
  editorSeatPriceFormatted,
  intervalIsYearly,
  currentBillingCycleEnd
} = useWorkspacePlan(props.workspace?.slug || '')

const needsEditorUpgrade = computed(() => {
  return props.action === 'make' && props.user.seatType === SeatTypes.Viewer
})

const isUnpaidPaidUpgrade = computed(() => {
  return isFreePlan.value || hasAvailableEditorSeats.value || isUnlimitedPlan.value
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
      return isUnpaidPaidUpgrade.value ? 'Make an admin' : 'Confirm and pay'
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

const handleConfirm = async () => {
  if (!props.workspace?.id) return

  isLoading.value = true
  try {
    await updateUserRole({
      userId: props.user.id,
      role: props.action === 'make' ? Roles.Workspace.Admin : Roles.Workspace.Member,
      workspaceId: props.workspace.id,
      previousRole: props.user.role
    })

    if (!isUnpaidPaidUpgrade.value) {
      mixpanel.track('Workspace Seat Purchased', {
        location: 'upgrade_admin_dialog',
        seatType: 'editor',
        // eslint-disable-next-line camelcase
        workspace_id: props.workspace.id
      })
    }

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
    text: buttonText.value,
    props: {
      color: 'primary',
      loading: isLoading.value
    },
    onClick: handleConfirm
  }
])
</script>
