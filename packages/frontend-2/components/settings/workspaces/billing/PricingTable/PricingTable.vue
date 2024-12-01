<template>
  <div class="flex flex-col lg:flex-row gap-y-2 gap-x-2 w-full">
    <SettingsWorkspacesBillingPricingTablePlan
      v-for="plan in plans"
      :key="plan.name"
      :plan="plan"
      :yearly-interval-selected="isYearlySelected"
      v-bind="$props"
    />
  </div>
</template>

<script setup lang="ts">
import { type WorkspacePlan, BillingInterval } from '~/lib/common/generated/gql/graphql'
import { pricingPlansConfig } from '~/lib/billing/helpers/constants'
import type { MaybeNullOrUndefined } from '@speckle/shared'

const props = defineProps<{
  currentPlan?: MaybeNullOrUndefined<WorkspacePlan>
  workspaceId?: string
  isAdmin?: boolean
  activeBillingInterval?: BillingInterval
}>()

const plans = ref(pricingPlansConfig.plans)
const isYearlySelected = ref(false)

watch(
  () => props.activeBillingInterval,
  (newVal) => {
    isYearlySelected.value = newVal === BillingInterval.Yearly
  }
)
</script>
