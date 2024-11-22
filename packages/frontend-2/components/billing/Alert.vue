<template>
  <div>
    <CommonCard v-if="!hasValidPlan" class="bg-foundation py-3 px-4">
      <div class="flex gap-x-2">
        <ExclamationCircleIcon v-if="showIcon" class="h-4 w-4 text-danger mt-1" />
        <div class="flex-1 flex gap-x-4 items-center">
          <div class="flex-1">
            <h5 class="text-body-xs font-medium text-foreground">{{ title }}</h5>
            <p class="text-body-xs text-foreground-2">{{ description }}</p>
          </div>
          <slot name="actions" />
          <FormButton
            v-if="isPaymentFailed"
            :icon-right="ArrowTopRightOnSquareIcon"
            @click="billingPortalRedirect(workspace.id)"
          >
            Update payment information
          </FormButton>
        </div>
      </div>
    </CommonCard>
  </div>
</template>

<script setup lang="ts">
import {
  ExclamationCircleIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/vue/24/outline'
import { graphql } from '~/lib/common/generated/gql'
import {
  type BillingAlert_WorkspaceFragment,
  WorkspacePlanStatuses,
  WorkspacePlans
} from '~/lib/common/generated/gql/graphql'
import { useBillingActions } from '~/lib/billing/composables/actions'

graphql(`
  fragment BillingAlert_Workspace on Workspace {
    id
    plan {
      name
      status
    }
    subscription {
      billingInterval
      currentBillingCycleEnd
    }
  }
`)

const props = defineProps<{
  workspace: BillingAlert_WorkspaceFragment
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
const title = computed(() => {
  if (isTrial.value) {
    return `You are currently on a free ${
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
    return 'Upgrade to a paid plan to start your subscription.'
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
const showIcon = computed(() => {
  return !!planStatus.value && planStatus.value !== WorkspacePlanStatuses.Trial
})
const hasValidPlan = computed(() => planStatus.value === WorkspacePlanStatuses.Valid)
</script>
