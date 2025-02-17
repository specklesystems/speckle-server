<template>
  <LayoutDialog v-model:open="open" max-width="sm" :buttons="dialogButtons">
    <template #header>{{ title ? title : 'Remove user' }}</template>
    <div class="flex flex-col gap-y-2 text-body-xs text-foreground">
      <p class="py-2">
        Are you sure you want to remove
        <span class="font-medium">{{ name }}</span>
        from the workspace?
      </p>
      <p v-if="showBillingInfo" class="text-foreground-2">
        Your workspace is currently billed for {{ memberSeatText
        }}{{ hasGuestSeats ? ` and ${guestSeatText}` : '' }}. Your bill will remain the
        same until it is adjusted at the start of your next renewal:
        {{ nextBillingCycleEnd }}
      </p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { graphql } from '~/lib/common/generated/gql'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import {
  type SettingsSharedDeleteUserDialog_WorkspaceFragment,
  type WorkspacePlans,
  WorkspacePlanStatuses
} from '~/lib/common/generated/gql/graphql'
import dayjs from 'dayjs'
import { isPaidPlan } from '~/lib/billing/helpers/types'

graphql(`
  fragment SettingsSharedDeleteUserDialog_Workspace on Workspace {
    id
    plan {
      status
      name
    }
    subscription {
      currentBillingCycleEnd
      seats {
        guest
        plan
      }
    }
  }
`)

const emit = defineEmits<{
  (e: 'removeUser'): void
}>()

const props = defineProps<{
  name: string
  title?: string
  workspace: MaybeNullOrUndefined<SettingsSharedDeleteUserDialog_WorkspaceFragment>
}>()

const open = defineModel<boolean>('open', { required: true })

const memberSeatText = computed(() => {
  if (!props.workspace?.subscription) return ''
  return `${props.workspace.subscription.seats.plan} member ${
    props.workspace.subscription.seats.plan === 1 ? 'seat' : 'seats'
  }`
})
const guestSeatText = computed(() => {
  if (!props.workspace?.subscription) return ''
  return `${props.workspace.subscription.seats.guest} guest ${
    props.workspace.subscription.seats.guest === 1 ? 'seat' : 'seats'
  }`
})
const hasGuestSeats = computed(() => {
  return (
    props.workspace?.subscription?.seats.guest &&
    props.workspace.subscription.seats.guest > 0
  )
})
const nextBillingCycleEnd = computed(() => {
  if (!props.workspace?.subscription) return ''
  return dayjs(props.workspace.subscription.currentBillingCycleEnd).format(
    'MMMM D, YYYY'
  )
})
const showBillingInfo = computed(() => {
  if (!props.workspace?.plan) return false
  return (
    isPaidPlan(props.workspace.plan.name as unknown as WorkspacePlans) &&
    props.workspace.plan.status === WorkspacePlanStatuses.Valid
  )
})
const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => (open.value = false)
  },
  {
    text: 'Remove',
    props: { color: 'primary' },
    onClick: () => {
      open.value = false
      emit('removeUser')
    }
  }
])
</script>
