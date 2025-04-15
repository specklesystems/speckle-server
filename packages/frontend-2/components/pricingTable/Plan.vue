<template>
  <div
    class="border border-outline-3 bg-foundation text-foreground rounded-lg p-5 flex flex-col w-full"
  >
    <div class="lg:h-32 flex flex-col">
      <div class="flex-1">
        <div class="flex items-center gap-x-2">
          <h4 class="text-body font-medium">
            {{ formatName(plan) }}
          </h4>
          <CommonBadge v-if="badgeText" rounded>
            {{ badgeText }}
          </CommonBadge>
        </div>
        <p class="text-body mt-1">
          <span class="font-medium">
            {{ planPrice }}
          </span>
          per seat/month
        </p>
        <template v-if="plan !== WorkspacePlans.Free">
          <div class="flex items-center gap-x-2 mt-3 px-1">
            <FormSwitch
              v-model="isYearlyIntervalSelected"
              :show-label="false"
              name="billing-interval"
              @update:model-value="
                (newValue) => $emit('onYearlyIntervalSelected', newValue)
              "
            />
            <span class="text-body-2xs">Billed yearly</span>
            <CommonBadge rounded color-classes="text-foreground-2 bg-primary-muted">
              -10%
            </CommonBadge>
          </div>
        </template>
      </div>
      <div class="w-full mt-4">
        <div v-if="hasCta">
          <slot name="cta" />
        </div>
        <div
          v-else
          :key="`tooltip-${isYearlyIntervalSelected}-${plan}-${currentPlan?.name}`"
          v-tippy="buttonTooltip"
        >
          <FormButton
            :color="buttonColor"
            :disabled="!isSelectable"
            full-width
            @click="handleUpgradeClick"
          >
            {{ buttonText }}
          </FormButton>
        </div>
      </div>
    </div>
    <ul class="flex flex-col gap-y-2 mt-4 pt-3 border-t border-outline-3">
      <PricingTablePlanFeature
        is-included
        display-name="Unlimited editor and viewer seats"
        description="Some tooltip text"
      />
      <PricingTablePlanFeature
        is-included
        display-name="Unlimited guests"
        description="Some tooltip text"
      />
      <PricingTablePlanFeature
        is-included
        :display-name="`${planLimits.projectCount} project${
          planLimits.projectCount === 1 ? '' : 's'
        }`"
        description="Some tooltip text"
      />
      <PricingTablePlanFeature
        is-included
        :display-name="`${planLimits.modelCount} models per workspace`"
        description="Some tooltip text"
      />
      <PricingTablePlanFeature
        is-included
        :display-name="
          planLimits.versionsHistory
            ? `${planLimits.versionsHistory.value} day version history`
            : 'Full version history'
        "
        description="Some tooltip text"
      />
      <PricingTablePlanFeature
        is-included
        :display-name="
          planLimits.versionsHistory
            ? `${planLimits.versionsHistory.value} day comment history`
            : 'Full comment history'
        "
        description="Some tooltip text"
      />
      <PricingTablePlanFeature
        v-for="(featureMetadata, feature) in WorkspacePlanFeaturesMetadata"
        :key="feature"
        :is-included="planFeatures.includes(feature)"
        :display-name="featureMetadata.displayName"
        :description="featureMetadata.description"
      />
    </ul>
  </div>
</template>

<script setup lang="ts">
import {
  type MaybeNullOrUndefined,
  WorkspacePlans,
  WorkspacePlanFeaturesMetadata,
  WorkspacePlanConfigs
} from '@speckle/shared'
import {
  type WorkspacePlan,
  WorkspacePlanStatuses,
  BillingInterval,
  Currency
} from '~/lib/common/generated/gql/graphql'
import { useWorkspacePlanPrices } from '~/lib/billing/composables/prices'
import { formatPrice, formatName } from '~/lib/billing/helpers/plan'
import type { SetupContext } from 'vue'

const emit = defineEmits<{
  (e: 'onYearlyIntervalSelected', value: boolean): void
  (e: 'onUpgradeClick'): void
}>()

const props = defineProps<{
  plan: WorkspacePlans
  canUpgrade: boolean
  workspaceId?: MaybeNullOrUndefined<string>
  currentPlan?: MaybeNullOrUndefined<WorkspacePlan>
  activeBillingInterval?: MaybeNullOrUndefined<BillingInterval>
  hasSubscription?: MaybeNullOrUndefined<boolean>
  currency?: Currency
}>()
const isYearlyIntervalSelected = defineModel<boolean>('isYearlyIntervalSelected', {
  default: false
})

const slots: SetupContext['slots'] = useSlots()
const { prices } = useWorkspacePlanPrices()

const planLimits = computed(() => WorkspacePlanConfigs[props.plan].limits)
const planFeatures = computed(() => WorkspacePlanConfigs[props.plan].features)
const planPrice = computed(() => {
  let basePrice = 0
  if (props.plan === WorkspacePlans.Team || props.plan === WorkspacePlans.Pro) {
    basePrice =
      prices.value?.[props.currency || Currency.Usd]?.[props.plan]?.[
        isYearlyIntervalSelected.value
          ? BillingInterval.Yearly
          : BillingInterval.Monthly
      ].amount || 0
  }

  return formatPrice({
    amount: basePrice
      ? isYearlyIntervalSelected.value
        ? basePrice / 12
        : basePrice
      : 0,
    currency: props.currency || Currency.Usd
  })
})

const hasCta = computed(() => !!slots.cta)

const canUpgradeToPlan = computed(() => {
  if (!props.currentPlan) return false

  const allowedUpgrades: Partial<Record<WorkspacePlans, WorkspacePlans[]>> = {
    [WorkspacePlans.Free]: [WorkspacePlans.Team, WorkspacePlans.Pro],
    [WorkspacePlans.Team]: [WorkspacePlans.Pro]
  }

  return allowedUpgrades[props.currentPlan.name]?.includes(props.plan)
})

const isMatchingInterval = computed(
  () =>
    props.activeBillingInterval ===
    (isYearlyIntervalSelected.value ? BillingInterval.Yearly : BillingInterval.Monthly)
)

const isDowngrade = computed(() => {
  return !canUpgradeToPlan.value && props.currentPlan?.name !== props.plan
})

const isCurrentPlan = computed(() => {
  if (props.plan === WorkspacePlans.Free) {
    return props.currentPlan?.name === props.plan
  }
  return isMatchingInterval.value && props.currentPlan?.name === props.plan
})

const isAnnualToMonthly = computed(() => {
  return (
    !isMatchingInterval.value &&
    props.currentPlan?.name === props.plan &&
    !isYearlyIntervalSelected.value
  )
})

const isMonthlyToAnnual = computed(() => {
  return (
    !isMatchingInterval.value &&
    props.currentPlan?.name === props.plan &&
    isYearlyIntervalSelected.value
  )
})

const isSelectable = computed(() => {
  if (!props.canUpgrade) return false
  // Free CTA has no clickable scenario
  if (props.plan === WorkspacePlans.Free) return false

  // Always enable buttons during expired or canceled state
  if (
    props.currentPlan?.status === WorkspacePlanStatuses.Expired ||
    props.currentPlan?.status === WorkspacePlanStatuses.Canceled
  )
    return true

  // Allow selection if switching from monthly to yearly for the same plan
  if (isMonthlyToAnnual.value && props.currentPlan?.name === props.plan) return true

  // Disable if current plan and intervals match
  if (isCurrentPlan.value) return false

  // Handle billing interval changes
  if (!isMatchingInterval.value) {
    // Allow yearly upgrades from monthly plans
    if (isMonthlyToAnnual.value) return canUpgradeToPlan.value

    // Never allow switching to monthly if currently on yearly billing
    if (props.activeBillingInterval === BillingInterval.Yearly) return false

    // Allow monthly plan changes only for upgrades
    return canUpgradeToPlan.value
  }

  // Allow upgrades to higher tier plans
  return canUpgradeToPlan.value
})

const buttonColor = computed(() => {
  if (props.currentPlan?.name === WorkspacePlans.Free) {
    return props.plan === WorkspacePlans.Team ? 'primary' : 'outline'
  }
  return 'outline'
})

const buttonText = computed(() => {
  // Current plan case
  if (isCurrentPlan.value) {
    return 'Current plan'
  }
  // Allow if current plan is Free, or the current plan is expired/canceled
  if (
    props.currentPlan?.name === WorkspacePlans.Free ||
    props.currentPlan?.status === WorkspacePlanStatuses.Expired ||
    props.currentPlan?.status === WorkspacePlanStatuses.Canceled
  ) {
    return `Subscribe to ${formatName(props.plan)}`
  }
  // Billing interval and lower plan case
  if (isDowngrade.value) {
    return `Downgrade to ${props.plan}`
  }
  // Billing interval change and current plan
  if (isAnnualToMonthly.value) {
    return 'Change to monthly plan'
  }
  if (isMonthlyToAnnual.value) {
    return 'Change to annual plan'
  }
  // Upgrade case
  return canUpgradeToPlan.value ? `Upgrade to ${formatName(props.plan)}` : ''
})

const buttonTooltip = computed(() => {
  if (!props.canUpgrade) {
    return 'You must be a workspace admin.'
  }

  if (
    isCurrentPlan.value ||
    props.currentPlan?.status === WorkspacePlanStatuses.Expired ||
    props.currentPlan?.status === WorkspacePlanStatuses.Canceled
  )
    return undefined

  if (isDowngrade.value) {
    return 'Downgrading is not supported at the moment. Please contact billing@speckle.systems.'
  }

  if (isAnnualToMonthly.value) {
    return 'Changing from an annual to a monthly plan is currently not supported. Please contact billing@speckle.systems.'
  }

  if (
    props.activeBillingInterval === BillingInterval.Yearly &&
    !isYearlyIntervalSelected.value &&
    canUpgradeToPlan.value
  ) {
    return 'Upgrading from an annual plan to a monthly plan is not supported. Please contact billing@speckle.systems.'
  }

  return undefined
})

const badgeText = computed(() =>
  props.currentPlan?.name === props.plan ? 'Current plan' : ''
)

const handleUpgradeClick = () => {
  if (!props.workspaceId) return
  if (props.plan !== WorkspacePlans.Team && props.plan !== WorkspacePlans.Pro) return
  emit('onUpgradeClick')
}
</script>
