<template>
  <div>
    <CommonAlert :color="alertColor" :actions="actions">
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
import { graphql } from '~/lib/common/generated/gql'
import {
  type BillingAlert_WorkspaceFragment,
  WorkspacePlanStatuses
} from '~/lib/common/generated/gql/graphql'
import { useBillingActions } from '~/lib/billing/composables/actions'
import type { AlertAction, AlertColor } from '@speckle/ui-components'
import { type MaybeNullOrUndefined, Roles } from '@speckle/shared'
import { settingsWorkspaceRoutes } from '~/lib/common/helpers/route'

graphql(`
  fragment BillingAlert_Workspace on Workspace {
    id
    role
    slug
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
  workspace: MaybeNullOrUndefined<BillingAlert_WorkspaceFragment>
  hideSettingsLinks?: boolean
}>()

const { billingPortalRedirect } = useBillingActions()

const planStatus = computed(() => props.workspace?.plan?.status)

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
      return 'Your workspace has been cancelled and is in read-only mode. Resubscribe to a plan to regain full access.'
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
      return 'warning'
    default:
      return 'neutral'
  }
})

const isWorkspaceGuest = computed(() => props.workspace?.role === Roles.Workspace.Guest)

const actions = computed((): AlertAction[] => {
  const actions: Array<AlertAction> = []

  if (isWorkspaceGuest.value) return actions

  if (planStatus.value === WorkspacePlanStatuses.PaymentFailed) {
    actions.push({
      title: 'Update payment information',
      onClick: () => billingPortalRedirect(props.workspace?.id)
    })
  }

  if (planStatus.value === WorkspacePlanStatuses.CancelationScheduled) {
    actions.push({
      title: 'Renew subscription',
      onClick: () => billingPortalRedirect(props.workspace?.id)
    })
  }

  if (planStatus.value === WorkspacePlanStatuses.Canceled && !props.hideSettingsLinks) {
    actions.push({
      title: 'Resubscribe',
      onClick: () =>
        navigateTo(settingsWorkspaceRoutes.billing.route(props.workspace?.slug || ''))
    })
  }

  return actions
})
</script>
