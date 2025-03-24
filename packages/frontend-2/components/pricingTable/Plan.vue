<template>
  <div
    class="border border-outline-3 bg-foundation text-foreground rounded-lg p-5 flex flex-col w-full"
  >
    <div class="lg:h-32">
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
      <p
        v-if="plan === WorkspacePlans.Free"
        class="text-body-xs text-foreground-2 mt-2.5"
      >
        For individuals and small teams trying Speckle.
      </p>
      <template v-else>
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
        <div class="w-full mt-4">
          <FormButton
            :color="buttonColor"
            :disabled="!isSelectable"
            full-width
            @click="handleUpgradeClick"
          >
            {{ buttonText }}
          </FormButton>
        </div>
      </template>
    </div>
    <ul class="flex flex-col gap-y-2 mt-4 pt-3 border-t border-outline-3">
      <li
        v-for="(featureMetadata, feature) in WorkspacePlanFeaturesMetadata"
        :key="feature"
        class="flex items-center text-body-xs"
        :class="{
          'lg:hidden': !planFeatures.includes(feature)
        }"
      >
        <IconCheck
          v-if="planFeatures.includes(feature)"
          class="w-4 h-4 text-foreground mx-2"
        />
        <XMarkIcon v-else class="w-4 h-4 mx-2 text-foreground-3" />
        <span
          v-tippy="featureMetadata.description"
          class="underline decoration-outline-5 decoration-dashed underline-offset-4 cursor-help"
          :class="{
            'text-foreground-2': !planFeatures.includes(feature)
          }"
        >
          {{ featureMetadata.displayName }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import {
  type MaybeNullOrUndefined,
  WorkspacePlans,
  WorkspacePlanFeaturesMetadata,
  WorkspacePlanConfigs,
  WorkspacePlanBillingIntervals
} from '@speckle/shared'
import {
  type WorkspacePlan,
  WorkspacePlanStatuses,
  BillingInterval
} from '~/lib/common/generated/gql/graphql'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useWorkspacePlanPrices } from '~/lib/billing/composables/prices'
import { formatPrice, formatName } from '~/lib/billing/helpers/plan'
import { useBillingActions } from '~/lib/billing/composables/actions'

defineEmits<{
  (e: 'onYearlyIntervalSelected', value: boolean): void
}>()

const props = defineProps<{
  plan: WorkspacePlans
  yearlyIntervalSelected: boolean
  currentPlan: MaybeNullOrUndefined<WorkspacePlan>
  isAdmin: boolean
  activeBillingInterval: MaybeNullOrUndefined<BillingInterval>
  hasSubscription: boolean
  workspaceId: MaybeNullOrUndefined<string>
}>()

const { pricesNew } = useWorkspacePlanPrices()
const { upgradePlan, redirectToCheckout } = useBillingActions()

const isYearlyIntervalSelected = ref(props.yearlyIntervalSelected)

const planFeatures = computed(() => WorkspacePlanConfigs[props.plan].features)
const planPrice = computed(() => {
  if (props.plan === WorkspacePlans.Team || props.plan === WorkspacePlans.Pro) {
    return formatPrice(
      pricesNew.value?.[props.plan]?.[WorkspacePlanBillingIntervals.Monthly]
    )
  }

  // This price is not returned from the server settings but is needed to display a price for the free plan
  return formatPrice({
    amount: 0,
    currencySymbol: '£'
  })
})

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
    (props.yearlyIntervalSelected ? BillingInterval.Yearly : BillingInterval.Monthly)
)

const isDowngrade = computed(() => {
  return !canUpgradeToPlan.value && props.currentPlan?.name !== props.plan
})

const isCurrentPlan = computed(
  () => isMatchingInterval.value && props.currentPlan?.name === props.plan
)

const isAnnualToMonthly = computed(() => {
  return (
    !isMatchingInterval.value &&
    props.currentPlan?.name === props.plan &&
    !props.yearlyIntervalSelected
  )
})

const isMonthlyToAnnual = computed(() => {
  return (
    !isMatchingInterval.value &&
    props.currentPlan?.name === props.plan &&
    props.yearlyIntervalSelected
  )
})

const isSelectable = computed(() => {
  if (!props.isAdmin) return false
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
    return props.plan === WorkspacePlans.Pro ? 'primary' : 'outline'
  }
  return 'outline'
})

const buttonText = computed(() => {
  // Allow if current plan is Free, or the current plan is expired/canceled
  if (
    props.currentPlan?.name === WorkspacePlans.Free ||
    props.currentPlan?.status === WorkspacePlanStatuses.Expired ||
    props.currentPlan?.status === WorkspacePlanStatuses.Canceled
  ) {
    return `Subscribe to ${formatName(props.plan)}`
  }
  // Current plan case
  if (isCurrentPlan.value) {
    return 'Current plan'
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

const badgeText = computed(() =>
  props.currentPlan?.name === props.plan ? 'Current plan' : ''
)

const handleUpgradeClick = () => {
  if (!props.workspaceId) return
  if (props.plan !== WorkspacePlans.Team && props.plan !== WorkspacePlans.Pro) return

  if (props.hasSubscription) {
    upgradePlan({
      plan: props.plan,
      cycle: isYearlyIntervalSelected.value
        ? BillingInterval.Yearly
        : BillingInterval.Monthly,
      workspaceId: props.workspaceId
    })
  } else {
    redirectToCheckout({
      plan: props.plan,
      cycle: isYearlyIntervalSelected.value
        ? BillingInterval.Yearly
        : BillingInterval.Monthly,
      workspaceId: props.workspaceId
    })
  }
}

watch(
  () => props.yearlyIntervalSelected,
  (newValue) => {
    isYearlyIntervalSelected.value = newValue
  }
)
</script>
