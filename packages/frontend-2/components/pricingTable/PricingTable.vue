<template>
  <div class="flex flex-col lg:grid lg:grid-cols-3 gap-4 w-full">
    <PricingTablePlan
      v-for="plan in plans"
      :key="plan"
      :plan="plan"
      :current-plan="currentPlan"
      :yearly-interval-selected="isYearlySelected"
      :active-billing-interval="billingInterval"
      :can-upgrade="isAdmin"
      :workspace-id="props.workspaceId"
      :has-subscription="!!subscription"
      :currency="props.currency"
      @on-yearly-interval-selected="onYearlyIntervalSelected"
      @on-upgrade-click="toggleUpgradeDialog(plan)"
    />

    <SettingsWorkspacesBillingUpgradeDialog
      v-model:open="isUpgradeDialogOpen"
      :slug="props.slug"
      :plan="planToUpgrade"
      :billing-interval="
        isYearlySelected ? BillingInterval.Yearly : BillingInterval.Monthly
      "
      :workspace-id="workspaceId"
      is-changing-plan
    />
  </div>
</template>

<script setup lang="ts">
import { BillingInterval, type Currency } from '~/lib/common/generated/gql/graphql'
import { WorkspacePlans } from '@speckle/shared'
import { useWorkspacePlan } from '~~/lib/workspaces/composables/plan'
import { type MaybeNullOrUndefined, type WorkspaceRoles, Roles } from '@speckle/shared'

const props = defineProps<{
  slug: string
  role: MaybeNullOrUndefined<WorkspaceRoles>
  workspaceId: MaybeNullOrUndefined<string>
  currency?: Currency
}>()

const {
  billingInterval,
  plan: currentPlan,
  subscription
} = useWorkspacePlan(props.slug)

const isYearlySelected = ref(false)
const isUpgradeDialogOpen = ref(false)
const planToUpgrade = ref<WorkspacePlans | null>(null)

const plans = computed(() => [
  WorkspacePlans.Free,
  WorkspacePlans.Team,
  WorkspacePlans.Pro
])

const isAdmin = computed(() => props.role === Roles.Workspace.Admin)

const toggleUpgradeDialog = (plan: WorkspacePlans) => {
  planToUpgrade.value = plan
  isUpgradeDialogOpen.value = !isUpgradeDialogOpen.value
}

const onYearlyIntervalSelected = (newValue: boolean) => {
  isYearlySelected.value = newValue
}

watch(
  () => billingInterval.value,
  (newVal) => {
    isYearlySelected.value = newVal === BillingInterval.Yearly
  },
  { immediate: true }
)
</script>
