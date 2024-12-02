<template>
  <div class="flex flex-col lg:grid lg:grid-cols-3 gap-y-2 gap-x-2 w-full">
    <SettingsWorkspacesBillingPricingTablePlan
      v-for="plan in plans"
      :key="plan.name"
      :plan="plan"
      :yearly-interval-selected="isYearlySelected"
      v-bind="$props"
      @on-yearly-interval-selected="onYearlyIntervalSelected"
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
  },
  { immediate: true }
)

const onYearlyIntervalSelected = (newValue: boolean) => {
  isYearlySelected.value = newValue
}
</script>
