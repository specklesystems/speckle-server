<template>
  <div>
    <CommonAlert v-if="!hasValidPlan" :color="alertColor" :actions="actions">
      <template #title>
        {{ title }}
      </template>
      <template #description>
        {{ description }}
      </template>
    </CommonAlert>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { graphql } from '~/lib/common/generated/gql'
import {
  type BillingAlert_WorkspaceFragment,
  WorkspacePlanStatuses,
  WorkspacePlans
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
}>()

const { billingPortalRedirect } = useBillingActions()

const planStatus = computed(() => props.workspace.plan?.status)
// If there is no plan status, we assume it's a trial
const isTrial = computed(
  () => !planStatus.value || planStatus.value === WorkspacePlanStatuses.Trial
)
const isPaymentFailed = computed(
  () => planStatus.value === WorkspacePlanStatuses.PaymentFailed
)
const trialDaysLeft = computed(() => {
  const createdAt = props.workspace.plan?.createdAt
  const trialEndDate = dayjs(createdAt).add(31, 'days')
  const diffDays = trialEndDate.diff(dayjs(), 'day')
  return Math.max(0, diffDays)
})
const title = computed(() => {
  if (isTrial.value) {
    return `You have ${trialDaysLeft.value} day${
      trialDaysLeft.value !== 1 ? 's' : ''
    } left on your free ${
      props.workspace.plan?.name ?? WorkspacePlans.Starter
    } plan trial`
  }
  switch (planStatus.value) {
    case WorkspacePlanStatuses.CancelationScheduled:
      return `Your ${props.workspace.plan?.name} plan subscription is scheduled for cancelation`
    case WorkspacePlanStatuses.Canceled:
      return `Your ${props.workspace.plan?.name} plan subscription has been canceled`
    case WorkspacePlanStatuses.Expired:
      return `Your free ${props.workspace.plan?.name} plan trial has ended`
    case WorkspacePlanStatuses.PaymentFailed:
      return "Your last payment didn't go through"
    default:
      return ''
  }
})
const description = computed(() => {
  if (isTrial.value) {
    return trialDaysLeft.value === 0
      ? 'Upgrade to a paid plan to continue using your workspace.'
      : 'Upgrade to a paid plan to start your subscription.'
  }
  switch (planStatus.value) {
    case WorkspacePlanStatuses.CancelationScheduled:
      return 'Your workspace subscription is scheduled for cancelation. After the cancelation, your workspace will be in read-only mode.'
    case WorkspacePlanStatuses.Canceled:
      return 'Your workspace has been canceled and is in read-only mode. Upgrade your plan to continue.'
    case WorkspacePlanStatuses.Expired:
      return "The workspace is in a read-only locked state until there's an active subscription. Upgrade your plan to continue."
    case WorkspacePlanStatuses.PaymentFailed:
      return "Update your payment information now to ensure your workspace doesn't go into maintenance mode."
    default:
      return ''
  }
})
const alertColor = computed<AlertColor>(() => {
  switch (planStatus.value) {
    case WorkspacePlanStatuses.PaymentFailed:
    case WorkspacePlanStatuses.Canceled:
      return 'danger'
    case WorkspacePlanStatuses.CancelationScheduled:
    case WorkspacePlanStatuses.Expired:
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
  }

  return actions
})
const hasValidPlan = computed(() => planStatus.value === WorkspacePlanStatuses.Valid)
</script>
