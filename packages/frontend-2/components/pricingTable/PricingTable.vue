<template>
  <div class="flex flex-col lg:grid lg:grid-cols-3 gap-4 w-full">
    <PricingTablePlan
      v-for="plan in plans"
      :key="plan"
      v-model:is-yearly-interval-selected="isYearlyIntervalSelected"
      :plan="plan"
      :current-plan="currentPlan"
      :active-billing-interval="billingInterval"
      :can-upgrade="isAdmin"
      :workspace-id="props.workspaceId"
      :has-subscription="!!subscription"
      :currency="props.currency"
      @on-yearly-interval-selected="onYearlyIntervalSelected"
      @on-upgrade-click="toggleUpgradeDialog(plan as PaidWorkspacePlansNew)"
    />

    <SettingsWorkspacesBillingUpgradeDialog
      v-if="planToUpgrade"
      v-model:open="isUpgradeDialogOpen"
      :slug="props.slug"
      :plan="planToUpgrade"
      :billing-interval="
        isYearlyIntervalSelected ? BillingInterval.Yearly : BillingInterval.Monthly
      "
      :workspace-id="workspaceId"
      is-changing-plan
    />
  </div>
</template>

<script setup lang="ts">
import { BillingInterval, type Currency } from '~/lib/common/generated/gql/graphql'
import {
  WorkspacePlans,
  type PaidWorkspacePlansNew,
  type MaybeNullOrUndefined,
  type WorkspaceRoles,
  Roles
} from '@speckle/shared'
import { useWorkspacePlan } from '~~/lib/workspaces/composables/plan'

const props = defineProps<{
  slug: string
  role: MaybeNullOrUndefined<WorkspaceRoles>
  workspaceId: MaybeNullOrUndefined<string>
  currency?: Currency
}>()

const {
  billingInterval,
  plan: currentPlan,
  subscription,
  intervalIsYearly
} = useWorkspacePlan(props.slug)

const isYearlyIntervalSelected = ref(false)
const isUpgradeDialogOpen = ref(false)
const planToUpgrade = ref<PaidWorkspacePlansNew | null>(null)

const plans = computed(() => [
  WorkspacePlans.Free,
  WorkspacePlans.Team,
  WorkspacePlans.Pro
])

const isAdmin = computed(() => props.role === Roles.Workspace.Admin)

const toggleUpgradeDialog = (plan: PaidWorkspacePlansNew) => {
  planToUpgrade.value = plan
  isUpgradeDialogOpen.value = !isUpgradeDialogOpen.value
}

const onYearlyIntervalSelected = (newValue: boolean) => {
  isYearlySelected.value = newValue
}

watch(
  () => intervalIsYearly.value,
  (newVal) => {
    isYearlyIntervalSelected.value = newVal
  },
  { immediate: true }
)
</script>
