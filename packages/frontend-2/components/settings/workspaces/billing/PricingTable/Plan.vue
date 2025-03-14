<template>
  <div
    class="border border-outline-3 bg-foundation text-foreground rounded-lg p-5 flex flex-col w-full"
  >
    <div class="flex items-center gap-x-2">
      <h4 class="text-body font-medium">
        Workspace
        <span class="capitalize">{{ plan }}</span>
      </h4>
      <CommonBadge v-if="badgeText" rounded>
        {{ badgeText }}
      </CommonBadge>
    </div>
    <p class="text-body mt-1">
      <span class="font-medium">
        {{ formatPrice(planPrice?.['workspace:member']) }}
      </span>
      per seat/month
    </p>
    <div class="flex items-center gap-x-2 mt-3 px-1">
      <FormSwitch
        v-model="isYearlyIntervalSelected"
        :show-label="false"
        name="domain-protection"
        @update:model-value="(newValue) => $emit('onYearlyIntervalSelected', newValue)"
      />
      <span class="text-body-2xs">Billed annually</span>
      <CommonBadge rounded color-classes="text-foreground-2 bg-primary-muted">
        20% off
      </CommonBadge>
    </div>
    <div v-if="workspaceId || hasCta" class="w-full mt-4">
      <div v-if="hasCta">
        <slot name="cta" />
      </div>
      <div v-else>
        <!-- Key to fix tippy reactivity -->
        <div
          :key="`tooltip-${yearlyIntervalSelected}-${plan}-${currentPlan?.name}`"
          v-tippy="buttonTooltip"
        >
          <FormButton
            :color="buttonColor"
            :disabled="!isSelectable"
            full-width
            @click="onCtaClick"
          >
            {{ buttonText }}
          </FormButton>
        </div>
      </div>
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
          v-tippy="
            isFunction(featureMetadata.description)
              ? featureMetadata.description({
                  price: formatPrice(planPrice?.[Roles.Workspace.Guest])
                })
              : featureMetadata.description
          "
          class="underline decoration-outline-5 decoration-dashed underline-offset-4 cursor-help"
          :class="{
            'text-foreground-2': !planFeatures.includes(feature)
          }"
        >
          {{ featureMetadata.displayName }}
        </span>
      </li>
    </ul>

    <SettingsWorkspacesBillingUpgradeDialog
      v-if="currentPlan?.name && workspaceId"
      v-model:open="isUpgradeDialogOpen"
      :plan="plan"
      :billing-interval="
        yearlyIntervalSelected ? BillingInterval.Yearly : BillingInterval.Monthly
      "
      :workspace-id="workspaceId"
    />
  </div>
</template>

<script setup lang="ts">
import {
  type PaidWorkspacePlansOld,
  type MaybeNullOrUndefined,
  WorkspacePlans,
  WorkspacePlanFeaturesMetadata
} from '@speckle/shared'
import { Roles, WorkspacePlanConfigs } from '@speckle/shared'
import {
  type WorkspacePlan,
  WorkspacePlanStatuses,
  BillingInterval
} from '~/lib/common/generated/gql/graphql'
import { startCase, isFunction } from 'lodash'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import type { SetupContext } from 'vue'
import { useWorkspacePlanPrices } from '~/lib/billing/composables/prices'
import { formatPrice } from '~/lib/billing/helpers/prices'

const emit = defineEmits<{
  (e: 'onYearlyIntervalSelected', value: boolean): void
  (e: 'onPlanSelected', value: PaidWorkspacePlansOld): void
}>()

const props = defineProps<{
  plan: PaidWorkspacePlansOld
  yearlyIntervalSelected: boolean
  badgeText?: string
  // The following props are optional if the table is for informational purposes
  currentPlan?: MaybeNullOrUndefined<WorkspacePlan>
  workspaceId?: string
  isAdmin?: boolean
  activeBillingInterval?: BillingInterval
}>()

const slots: SetupContext['slots'] = useSlots()
const { prices } = useWorkspacePlanPrices()

const isUpgradeDialogOpen = ref(false)
const isYearlyIntervalSelected = ref(props.yearlyIntervalSelected)

const planFeatures = computed(() => WorkspacePlanConfigs[props.plan].features)
const planPrice = computed(() => prices.value?.[props.plan]?.monthly)

const hasCta = computed(() => !!slots.cta)
const canUpgradeToPlan = computed(() => {
  if (!props.currentPlan) return false

  const allowedUpgrades: Record<WorkspacePlans, WorkspacePlans[]> = {
    [WorkspacePlans.Starter]: [WorkspacePlans.Plus, WorkspacePlans.Business],
    [WorkspacePlans.Plus]: [WorkspacePlans.Business],
    [WorkspacePlans.Business]: [],
    [WorkspacePlans.Academia]: [],
    [WorkspacePlans.Unlimited]: [],
    [WorkspacePlans.StarterInvoiced]: [],
    [WorkspacePlans.PlusInvoiced]: [],
    [WorkspacePlans.BusinessInvoiced]: [],
    // New
    [WorkspacePlans.Free]: [],
    [WorkspacePlans.Team]: [],
    [WorkspacePlans.Pro]: []
  }

  return allowedUpgrades[props.currentPlan.name].includes(props.plan)
})

const statusIsTrial = computed(
  () => props.currentPlan?.status === WorkspacePlanStatuses.Trial || !props.currentPlan
)

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
  // Always enable buttons during trial, expired or canceled state
  if (
    statusIsTrial.value ||
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
  if (
    statusIsTrial.value ||
    props.currentPlan?.status === WorkspacePlanStatuses.Expired
  ) {
    return props.plan === WorkspacePlans.Starter ? 'primary' : 'outline'
  }
  return 'outline'
})

const buttonText = computed(() => {
  // Allow selection during trial, expired or canceled state
  if (
    statusIsTrial.value ||
    props.currentPlan?.status === WorkspacePlanStatuses.Expired ||
    props.currentPlan?.status === WorkspacePlanStatuses.Canceled
  ) {
    return `Subscribe to ${startCase(props.plan)}`
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
  return canUpgradeToPlan.value ? `Upgrade to ${startCase(props.plan)}` : ''
})

const buttonTooltip = computed(() => {
  if (!props.isAdmin) {
    return 'You must be a workspace admin.'
  }

  if (
    statusIsTrial.value ||
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
    !props.yearlyIntervalSelected &&
    canUpgradeToPlan.value
  ) {
    return 'Upgrading from an annual plan to a monthly plan is not supported. Please contact billing@speckle.systems.'
  }

  return undefined
})

const onCtaClick = () => {
  emit('onPlanSelected', props.plan)
}

watch(
  () => props.yearlyIntervalSelected,
  (newValue) => {
    isYearlyIntervalSelected.value = newValue
  }
)
</script>
