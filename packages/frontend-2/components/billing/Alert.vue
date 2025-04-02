<template>
  <div>
    <template v-if="!hasValidPlan">
      <CommonAlert :color="alertColor" :actions="actions">
        <template #title>
          {{ title }}
        </template>
        <template #description>
          {{ description }}
        </template>
      </CommonAlert>
    </template>
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql'
import {
  type BillingAlert_WorkspaceFragment,
  WorkspacePlanStatuses
} from '~/lib/common/generated/gql/graphql'
import { useBillingActions } from '~/lib/billing/composables/actions'
import type { AlertAction, AlertColor } from '@speckle/ui-components'

graphql(`
  fragment BillingAlert_Workspace on Workspace {
    id
    plan {
      name
      status
      createdAt
    }
    subscription {
      billingInterval
      currentBillingCycleEnd
    }
  }
`)

const props = defineProps<{
  workspace: BillingAlert_WorkspaceFragment
  actions?: Array<AlertAction>
  condensed?: boolean
}>()

const { billingPortalRedirect } = useBillingActions()

const planStatus = computed(() => props.workspace.plan?.status)
const isPaymentFailed = computed(
  () => planStatus.value === WorkspacePlanStatuses.PaymentFailed
)
const isScheduledForCancelation = computed(
  () => planStatus.value === WorkspacePlanStatuses.CancelationScheduled
)
const title = computed(() => {
  switch (planStatus.value) {
    case WorkspacePlanStatuses.CancelationScheduled:
      return `Your workspace subscription is scheduled for cancellation`
    case WorkspacePlanStatuses.Canceled:
      return `Your workspace subscription has been cancelled`
    case WorkspacePlanStatuses.PaymentFailed:
      return "Your last payment didn't go through"
    default:
      return ''
  }
})
const description = computed(() => {
  switch (planStatus.value) {
    case WorkspacePlanStatuses.CancelationScheduled:
      return 'Once the current billing cycle ends your workspace will enter read-only mode. Renew your subscription to undo.'
    case WorkspacePlanStatuses.Canceled:
      return 'Your workspace has been cancelled and is in read-only mode. Subscribe to a plan to regain full access.'
    case WorkspacePlanStatuses.PaymentFailed:
      return "Update your payment information now to ensure your workspace doesn't go into maintenance mode."
    default:
      return ''
  }
})
const hasValidPlan = computed(() => planStatus.value === WorkspacePlanStatuses.Valid)

const alertColor = computed<AlertColor>(() => {
  switch (planStatus.value) {
    case WorkspacePlanStatuses.PaymentFailed:
    case WorkspacePlanStatuses.Canceled:
      return 'danger'
    case WorkspacePlanStatuses.CancelationScheduled:
      return 'warning'
    default:
      return 'neutral'
  }
})

const actions = computed((): AlertAction[] => {
  const actions: Array<AlertAction> = props.actions ?? []

  if (isPaymentFailed.value) {
    actions.push({
      title: 'Update payment information',
      onClick: () => billingPortalRedirect(props.workspace.id),
      disabled: !props.workspace.id
    })
  } else if (isScheduledForCancelation.value) {
    actions.push({
      title: 'Renew subscription',
      onClick: () => billingPortalRedirect(props.workspace.id),
      disabled: !props.workspace.id
    })
  }

  return actions
})
</script>
