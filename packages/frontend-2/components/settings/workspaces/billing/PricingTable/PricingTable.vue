<template>
  <div class="flex flex-col lg:grid lg:grid-cols-3 gap-4 w-full">
    <SettingsWorkspacesBillingPricingTablePlan
      v-for="plan in oldPlans"
      :key="plan"
      :plan="plan"
      :yearly-interval-selected="isYearlySelected"
      v-bind="$props"
      @on-yearly-interval-selected="onYearlyIntervalSelected"
      @on-plan-selected="onPlanSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { type WorkspacePlan, BillingInterval } from '~/lib/common/generated/gql/graphql'
import { type MaybeNullOrUndefined, PaidWorkspacePlansOld } from '@speckle/shared'

const emit = defineEmits<{
  (
    e: 'onPlanSelected',
    value: { name: PaidWorkspacePlansOld; cycle: BillingInterval }
  ): void
}>()

const props = defineProps<{
  currentPlan?: MaybeNullOrUndefined<WorkspacePlan>
  workspaceId?: string
  isAdmin?: boolean
  activeBillingInterval?: BillingInterval
}>()

const isYearlySelected = ref(false)
const oldPlans = computed(() => Object.values(PaidWorkspacePlansOld))

const onYearlyIntervalSelected = (newValue: boolean) => {
  isYearlySelected.value = newValue
}

const onPlanSelected = (value: PaidWorkspacePlansOld) => {
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
