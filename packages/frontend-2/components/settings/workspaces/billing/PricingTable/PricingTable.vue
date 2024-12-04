<template>
  <div class="flex flex-col lg:grid-cols-3 gap-4 w-full">
    <SettingsWorkspacesBillingPricingTablePlan
      v-for="plan in plans"
      :key="plan.name"
      :plan="plan"
      :yearly-interval-selected="isYearlySelected"
      v-bind="$props"
      @on-yearly-interval-selected="onYearlyIntervalSelected"
      @on-plan-selected="onPlanSelected"
    />
  </div>
</template>

<script setup lang="ts">
import {
  type WorkspacePlan,
  BillingInterval,
  type WorkspacePlans
} from '~/lib/common/generated/gql/graphql'
import { pricingPlansConfig } from '~/lib/billing/helpers/constants'
import type { MaybeNullOrUndefined } from '@speckle/shared'

const emit = defineEmits<{
  (e: 'onPlanSelected', value: { name: WorkspacePlans; cycle: BillingInterval }): void
}>()

const props = defineProps<{
  currentPlan?: MaybeNullOrUndefined<WorkspacePlan>
  workspaceId?: string
  isAdmin?: boolean
  activeBillingInterval?: BillingInterval
}>()

const plans = ref(pricingPlansConfig.plans)
const isYearlySelected = ref(false)

const onYearlyIntervalSelected = (newValue: boolean) => {
  isYearlySelected.value = newValue
}

const onPlanSelected = (value: WorkspacePlans) => {
  emit('onPlanSelected', {
    name: value,
    cycle: isYearlySelected.value ? BillingInterval.Yearly : BillingInterval.Monthly
  })
}

watch(
  () => props.activeBillingInterval,
  (newVal) => {
    isYearlySelected.value = newVal === BillingInterval.Yearly
  },
  { immediate: true }
)
</script>
