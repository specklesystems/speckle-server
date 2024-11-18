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
    <FormButton
      :color="plan.name === WorkspacePlans.Team ? 'primary' : 'outline'"
      :disabled="!hasTrialPlan && !canUpgradeToPlan"
      class="mt-3"
      full-width
      @click="onUpgradePlanClick(plan.name)"
    >
      {{ hasTrialPlan ? 'Subscribe' : 'Upgrade' }} to&nbsp;
      <span class="capitalize">{{ plan.name }}</span>
    </FormButton>
  </div>
</template>

<script setup lang="ts">
import { type PricingPlan } from '@/lib/billing/helpers/types'
import { Roles } from '@speckle/shared'
import {
  type WorkspacePlan,
  WorkspacePlanStatuses,
  WorkspacePlans,
  BillingInterval
} from '~/lib/common/generated/gql/graphql'
import { useBillingActions } from '~/lib/billing/composables/actions'
import type { MaybeNullOrUndefined } from '@speckle/shared'
const props = defineProps<{
  plan: PricingPlan
  isYearlyPlan: boolean
  currentPlan: MaybeNullOrUndefined<WorkspacePlan>
  workspaceId: string
}>()

const { upgradePlanRedirect } = useBillingActions()

const canUpgradeToPlan = computed(() => {
  if (!props.currentPlan) return false

  const allowedUpgrades: Record<WorkspacePlans, WorkspacePlans[]> = {
    [WorkspacePlans.Team]: [WorkspacePlans.Pro, WorkspacePlans.Business],
    [WorkspacePlans.Pro]: [WorkspacePlans.Business],
    [WorkspacePlans.Business]: [],
    [WorkspacePlans.Academia]: [],
    [WorkspacePlans.Unlimited]: []
  }

  return allowedUpgrades[props.currentPlan.name].includes(props.plan.name)
})
const hasTrialPlan = computed(
  () => props.currentPlan?.status === WorkspacePlanStatuses.Trial || !props.currentPlan
)

const onUpgradePlanClick = (plan: WorkspacePlans) => {
  upgradePlanRedirect({
    plan,
    cycle: props.isYearlyPlan ? BillingInterval.Yearly : BillingInterval.Monthly,
    workspaceId: props.workspaceId
  })
}
</script>
