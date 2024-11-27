<template>
  <div class="flex flex-col gap-y-1 font-normal">
    <h4 class="text-foreground text-body-xs">
      Workspace
      <span class="capitalize">{{ plan.name }}</span>
    </h4>
    <p class="text-foreground text-heading">
      £{{
        isYearlyPlan
          ? plan.cost.yearly[Roles.Workspace.Member]
          : plan.cost.monthly[Roles.Workspace.Member]
      }}
      per seat/month
    </p>
    <p class="text-foreground-2 text-body-2xs pt-1">
      Billed {{ isYearlyPlan ? 'annually' : 'monthly' }}
    </p>
    <div v-if="workspaceId" class="w-full">
      <FormButton
        :color="buttonColor"
        :disabled="!buttonEnabled"
        class="mt-3"
        full-width
        @click="onUpgradePlanClick(plan.name)"
      >
        {{ buttonText }}
      </FormButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type PricingPlan, isPaidPlan } from '@/lib/billing/helpers/types'
import { Roles } from '@speckle/shared'
import {
  type WorkspacePlan,
  type PaidWorkspacePlans,
  WorkspacePlanStatuses,
  WorkspacePlans,
  BillingInterval
} from '~/lib/common/generated/gql/graphql'
import { useBillingActions } from '~/lib/billing/composables/actions'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { startCase } from 'lodash'

const props = defineProps<{
  plan: PricingPlan
  isYearlyPlan: boolean
  // The following props are optional if the table is for informational purposes
  currentPlan?: MaybeNullOrUndefined<WorkspacePlan>
  workspaceId?: string
  isAdmin?: boolean
  activeBillingInterval?: BillingInterval
}>()

const { upgradePlanRedirect } = useBillingActions()

const canUpgradeToPlan = computed(() => {
  if (!props.currentPlan) return false

  const allowedUpgrades: Record<WorkspacePlans, WorkspacePlans[]> = {
    [WorkspacePlans.Starter]: [WorkspacePlans.Plus, WorkspacePlans.Business],
    [WorkspacePlans.Plus]: [WorkspacePlans.Business],
    [WorkspacePlans.Business]: [],
    [WorkspacePlans.Academia]: [],
    [WorkspacePlans.Unlimited]: []
  }

  return allowedUpgrades[props.currentPlan.name].includes(props.plan.name)
})
const hasTrialPlan = computed(
  () => props.currentPlan?.status === WorkspacePlanStatuses.Trial || !props.currentPlan
)
const buttonColor = computed(() => {
  // If on trial plan highlight starter plan
  if (hasTrialPlan.value) {
    return props.plan.name === WorkspacePlans.Starter ? 'primary' : 'outline'
  }
  // Else highlight current plan
  return props.currentPlan?.name === props.plan.name ? 'primary' : 'outline'
})
const buttonEnabled = computed(() => {
  if (!props.isAdmin) return false
  if (hasTrialPlan.value) return true
  if (canUpgradeToPlan.value) return true
  if (props.activeBillingInterval === BillingInterval.Monthly && props.isYearlyPlan)
    return true
  return false
})
const buttonText = computed(() => {
  if (props.currentPlan?.name === props.plan.name) return 'Current plan'
  if (hasTrialPlan.value) return `Subscribe to ${startCase(props.plan.name)}`
  if (canUpgradeToPlan.value) return `Upgrade to ${startCase(props.plan.name)}`
  // Current and higherer plans are upgradeable to a yearly billing cycle
  if (
    props.activeBillingInterval === BillingInterval.Monthly &&
    props.isYearlyPlan &&
    props.currentPlan?.name === props.plan.name
  )
    return 'Upgrade to annual plan'
  // If on yearly plan and downgrade to monthly
  if (
    props.activeBillingInterval === BillingInterval.Yearly &&
    !props.isYearlyPlan &&
    props.currentPlan?.name === props.plan.name
  )
    return 'Downgrade to monthly plan'
  return ''
})

const onUpgradePlanClick = (plan: WorkspacePlans) => {
  if (!isPaidPlan(plan) || !props.workspaceId) return
  upgradePlanRedirect({
    plan: plan as unknown as PaidWorkspacePlans,
    cycle: props.isYearlyPlan ? BillingInterval.Yearly : BillingInterval.Monthly,
    workspaceId: props.workspaceId
  })
}
</script>
