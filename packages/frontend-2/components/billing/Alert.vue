<template>
  <div>
    <div
      v-if="condensed"
      class="flex items-center justify-between rounded-md p-2 text-body-3xs font-medium bg-[#E0ECFF] text-primary-focus"
    >
      {{ title }}
      <FormButton
        v-if="actions.length > 0"
        size="sm"
        :disabled="actions[0].disabled"
        @click="actions[0].onClick"
      >
        {{ actions[0].title }}
      </FormButton>
    </div>
    <CommonAlert v-else :color="alertColor" :actions="actions">
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
// If there is no plan status, we assume it's a trial
const isTrial = computed(
  () => !planStatus.value || planStatus.value === WorkspacePlanStatuses.Trial
)
const isPaymentFailed = computed(
  () => planStatus.value === WorkspacePlanStatuses.PaymentFailed
)
const isScheduledForCancelation = computed(
  () => planStatus.value === WorkspacePlanStatuses.CancelationScheduled
)
const trialDaysLeft = computed(() => {
  const createdAt = props.workspace.plan?.createdAt
  const trialEndDate = dayjs(createdAt).add(31, 'days')
  const diffDays = trialEndDate.diff(dayjs(), 'day')
  return Math.max(0, diffDays)
})
const title = computed(() => {
  if (isTrial.value) {
    if (props.condensed) {
      return `${trialDaysLeft.value} day${
        trialDaysLeft.value !== 1 ? 's' : ''
      } left in trial.`
    } else
      return `You have ${trialDaysLeft.value} day${
        trialDaysLeft.value !== 1 ? 's' : ''
      } left on your free trial`
  }
  switch (planStatus.value) {
    case WorkspacePlanStatuses.CancelationScheduled:
      return `Your workspace subscription is scheduled for cancellation`
    case WorkspacePlanStatuses.Canceled:
      return `Your workspace subscription has been cancelled`
    case WorkspacePlanStatuses.Expired:
      return `Your free trial has ended`
    case WorkspacePlanStatuses.PaymentFailed:
      return "Your last payment didn't go through"
    default:
      return ''
  }
})
const description = computed(() => {
  if (isTrial.value) {
    return trialDaysLeft.value === 0
      ? 'Upgrade to a paid plan to continue using your workspace'
      : 'Upgrade to a paid plan to start your subscription'
  }
  switch (planStatus.value) {
    case WorkspacePlanStatuses.CancelationScheduled:
      return 'Once the current billing cycle ends your workspace will enter read-only mode. Renew your subscription to undo.'
    case WorkspacePlanStatuses.Canceled:
      return 'Your workspace has been cancelled and is in read-only mode. Subscribe to a plan to regain full access.'
    case WorkspacePlanStatuses.Expired:
      return "The workspace is in a read-only locked state until there's an active subscription. Subscribe to a plan to regain full access."
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
