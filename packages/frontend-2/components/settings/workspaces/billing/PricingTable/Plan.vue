<template>
  <div
    class="border border-outline-3 bg-foundation text-foreground rounded-lg p-6 flex flex-col w-full"
  >
    <div>
      <h4 class="text-body font-medium">
        Workspace
        <span class="capitalize">{{ plan.name }}</span>
      </h4>
    </div>

    <p class="text-body mt-1">
      <span class="font-medium">
        £{{
          yearlyIntervalSelected
            ? plan.cost.yearly[Roles.Workspace.Member]
            : plan.cost.monthly[Roles.Workspace.Member]
        }}
      </span>
      per seat/month
    </p>
    <div class="flex items-center gap-x-2 mt-3 px-1">
      <FormSwitch
        v-model="isYearlyIntervalSelected"
        :show-label="false"
        name="domain-protection"
        :disabled="!toggleEnabled"
        @update:model-value="(newValue) => $emit('onYearlyIntervalSelected', newValue)"
      />
      <span class="text-body-2xs">Billed annually</span>
      <CommonBadge rounded color-classes="text-foreground-2 bg-primary-muted">
        20% off
      </CommonBadge>
    </div>
    <div v-if="workspaceId" class="w-full mt-4">
      <FormButton
        :color="buttonColor"
        :disabled="!isSelectable"
        full-width
        @click="onCtaClick"
      >
        {{ buttonText }}
      </FormButton>
    </div>
    <ul class="flex flex-col gap-y-2 mt-4 pt-3 border-t border-outline-3">
      <li
        v-for="feature in features"
        :key="feature.name"
        class="flex items-center text-body-xs"
        :class="{
            'lg:hidden': !plan.features.includes(feature.name as PlanFeaturesList)
          }"
      >
        <IconCheck
          v-if="plan.features.includes(feature.name as PlanFeaturesList)"
          class="w-4 h-4 text-foreground mx-2"
        />
        <XMarkIcon v-else class="w-4 h-4 mx-2 text-danger" />
        <span
          v-tippy="
            feature.description(
              yearlyIntervalSelected
                ? plan.cost.yearly[Roles.Workspace.Guest]
                : plan.cost.monthly[Roles.Workspace.Guest]
            )
          "
          class="underline decoration-outline-5 decoration-dashed underline-offset-4 cursor-help"
          :class="{
            'text-foreground-2': !plan.features.includes(feature.name as PlanFeaturesList)
          }"
        >
          {{ feature.name }}
        </span>
      </li>
    </ul>

    <SettingsWorkspacesBillingUpgradeDialog
      v-if="currentPlan?.name && workspaceId"
      v-model:open="isUpgradeDialogOpen"
      :plan="plan.name"
      :billing-interval="
        yearlyIntervalSelected ? BillingInterval.Yearly : BillingInterval.Monthly
      "
      :workspace-id="workspaceId"
    />
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
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { startCase } from 'lodash'
import { pricingPlansConfig } from '~/lib/billing/helpers/constants'
import type { PlanFeaturesList } from '~/lib/billing/helpers/types'
import { XMarkIcon } from '@heroicons/vue/24/outline'

const emit = defineEmits<{
  (e: 'onYearlyIntervalSelected', value: boolean): void
  (e: 'onPlanSelected', value: WorkspacePlans): void
}>()

const props = defineProps<{
  plan: PricingPlan
  // The following props are optional if the table is for informational purposes
  currentPlan?: MaybeNullOrUndefined<WorkspacePlan>
  workspaceId?: string
  isAdmin?: boolean
  activeBillingInterval?: BillingInterval
  yearlyIntervalSelected: boolean
}>()

const features = ref(pricingPlansConfig.features)
const isUpgradeDialogOpen = ref(false)
const isYearlyIntervalSelected = ref(props.yearlyIntervalSelected)

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
const statusIsTrial = computed(
  () => props.currentPlan?.status === WorkspacePlanStatuses.Trial || !props.currentPlan
)
const buttonColor = computed(() => {
  if (statusIsTrial.value) {
    return props.plan.name === WorkspacePlans.Starter ? 'primary' : 'outline'
  }
  return 'outline'
})
const isMatchingInterval = computed(
  () =>
    props.activeBillingInterval ===
    (props.yearlyIntervalSelected ? BillingInterval.Yearly : BillingInterval.Monthly)
)
const isSelectable = computed(() => {
  // Always enable buttons during trial
  if (statusIsTrial.value) return true

  // Disable if user is already on this plan with same billing interval
  if (isMatchingInterval.value && props.currentPlan?.name === props.plan.name)
    return false

  // Handle billing interval changes
  if (!isMatchingInterval.value) {
    const isCurrentPlan = props.currentPlan?.name === props.plan.name
    const isMonthlyToYearly =
      props.yearlyIntervalSelected &&
      props.activeBillingInterval === BillingInterval.Monthly
    // Allow yearly upgrades from monthly plans
    if (isMonthlyToYearly) return isCurrentPlan || canUpgradeToPlan.value
    // Never allow switching to monthly if currently on yearly billing
    if (props.activeBillingInterval === BillingInterval.Yearly) return false
    // Allow monthly plan changes only for upgrades
    return canUpgradeToPlan.value
  }

  // Allow upgrades to higher tier plans
  return canUpgradeToPlan.value
})
const toggleEnabled = computed(() => {
  return statusIsTrial.value
    ? true
    : canUpgradeToPlan.value ||
        (props.currentPlan?.name === props.plan.name &&
          props.activeBillingInterval === BillingInterval.Monthly)
})
const buttonText = computed(() => {
  // Trial plan case
  if (statusIsTrial.value) {
    return `Subscribe to ${startCase(props.plan.name)}`
  }
  // Current plan case
  if (isMatchingInterval.value && props.currentPlan?.name === props.plan.name) {
    return 'Current plan'
  }
  // Billing interval and lower plan case
  if (!canUpgradeToPlan.value && props.currentPlan?.name !== props.plan.name) {
    return `Downgrade to ${props.plan.name}`
  }
  // Billing interval change and current plan
  if (!isMatchingInterval.value && props.currentPlan?.name === props.plan.name) {
    return props.yearlyIntervalSelected
      ? 'Change to annual plan'
      : 'Change to monthly plan'
  }
  // Upgrade case
  return canUpgradeToPlan.value ? `Upgrade to ${startCase(props.plan.name)}` : ''
})

const onCtaClick = () => {
  emit('onPlanSelected', props.plan.name)
}

watch(
  () => props.yearlyIntervalSelected,
  (newValue) => {
    isYearlyIntervalSelected.value = newValue
  }
)
</script>
