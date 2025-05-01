<template>
  <div>
    <BillingTransitionCards class="mb-4">
      <template #current-state>
        <div class="p-2">
          <p class="text-foreground text-body-3xs">
            {{ statusIsCanceled ? 'Old plan' : 'Current plan' }}
            <template v-if="!isFreePlan && !statusIsCanceled">
              (billed {{ intervalIsYearly ? 'yearly' : 'monthly' }})
            </template>
          </p>
          <div class="mt-2 flex justify-between items-center">
            <div class="flex items-center gap-x-2">
              <h3 class="text-body">{{ formatName(plan?.name) }}</h3>
              <CommonBadge
                v-if="hasUnlimitedAddon && statusIsCanceled"
                color-classes="bg-foundation border-blue-200 dark:border-blue-800 border"
                rounded
              >
                Unlimited Projects & Models
              </CommonBadge>
            </div>
            <p v-if="!isFreePlan && !statusIsCanceled" class="text-body-2xs">
              {{ currentEditorPrice }} per editor seat/month
            </p>
          </div>
          <template v-if="hasUnlimitedAddon && !statusIsCanceled">
            <div class="mt-2 flex justify-between items-center">
              <CommonBadge
                color-classes="bg-foundation border-blue-200 dark:border-blue-800 border"
                rounded
              >
                Unlimited Projects & Models
              </CommonBadge>
              <p class="text-body-2xs">{{ currentAddonPrice }} per editor seat/month</p>
            </div>
            <hr class="my-4 border-outline-2" />
            <div class="mt-2 flex justify-between items-center">
              <h3 class="text-body">Total</h3>
              <p class="text-body-2xs">{{ totalPrice }} per per editor seat/month</p>
            </div>
          </template>
        </div>
      </template>
      <template #new-state>
        <div class="p-2">
          <div class="flex gap-x-2 items-center">
            <p class="text-foreground text-body-3xs">
              New plan (billed {{ newIntervalIsYearly ? 'yearly' : 'monthly' }})
            </p>
            <CommonBadge
              v-if="billingInterval === BillingInterval.Yearly"
              color-classes="bg-blue-100 dark:bg-info-lighter"
              rounded
            >
              -10%
            </CommonBadge>
          </div>

          <div class="mt-2 flex justify-between items-center">
            <h3 class="text-body">{{ formatName(props.plan) }}</h3>
            <p class="text-body-2xs">{{ newEditorPrice }} per editor seat / month</p>
          </div>

          <template v-if="newPlanHasUnlimitedAddon">
            <div class="mt-2 flex justify-between items-center">
              <CommonBadge
                color-classes="bg-foundation border-blue-200 dark:border-blue-800 border"
                rounded
              >
                Unlimited Projects & Models
              </CommonBadge>
              <p class="text-body-2xs">{{ newAddonPrice }} per editor seat / month</p>
            </div>
            <template v-if="!isFreePlan">
              <hr class="my-4 border-outline-2" />
              <div class="flex justify-between items-center">
                <h3 class="text-body">Total</h3>
                <p class="text-body-2xs">
                  {{ newTotalPriceFormatted }} per editor seat / month
                </p>
              </div>
            </template>
          </template>

          <template v-if="isFreePlan">
            <hr class="my-4 border-outline-2" />
            <div class="flex flex-col gap-y-2">
              <div class="flex justify-between items-center">
                <h3 class="text-body">Total</h3>
                <p class="text-body-2xs">
                  {{ newTotalPriceFormatted }} x {{ editorSeatCount }} per editor seat{{
                    editorSeatCount === 1 ? '' : 's'
                  }}
                  / month
                </p>
              </div>
              <div class="flex justify-end">
                <p class="text-body-2xs font-semibold">
                  {{
                    formatPrice({
                      amount: newTotalPrice * editorSeatCount,
                      currency
                    })
                  }}
                  / month
                </p>
              </div>
            </div>
          </template>
        </div>
      </template>
    </BillingTransitionCards>

    <p
      v-if="plan?.name && isPaidPlan(plan.name) && !statusIsCanceled"
      class="text-foreground-2 text-body-2xs my-2"
    >
      The amount you will be charged today will be prorated based on the time remaining
      in your billing cycle.
    </p>
  </div>
</template>

<script setup lang="ts">
import { useWorkspacePlan } from '~/lib/workspaces/composables/plan'
import { formatName, formatPrice } from '~/lib/billing/helpers/plan'
import {
  useActiveWorkspacePlanPrices,
  useWorkspaceAddonPrices,
  useWorkspacePlanPrices
} from '~/lib/billing/composables/prices'
import {
  WorkspacePlans,
  isPaidPlan,
  doesPlanIncludeUnlimitedProjectsAddon,
  type PaidWorkspacePlans
} from '@speckle/shared'
import { BillingInterval } from '~/lib/common/generated/gql/graphql'

const props = defineProps<{
  slug: string
  plan: PaidWorkspacePlans
  billingInterval: BillingInterval
  editorSeatCount: number
}>()

const {
  intervalIsYearly,
  plan,
  currency,
  hasUnlimitedAddon,
  isFreePlan,
  statusIsCanceled
} = useWorkspacePlan(props.slug)
const { prices: activeWorkspacePrices } = useActiveWorkspacePlanPrices()
const { prices } = useWorkspacePlanPrices()
const { addonPrices } = useWorkspaceAddonPrices()

const currentEditorPrice = computed(() => {
  if (!plan.value?.name) return null

  if (
    plan.value.name === WorkspacePlans.TeamUnlimited ||
    plan.value.name === WorkspacePlans.ProUnlimited
  ) {
    const basePlanType =
      plan.value.name === WorkspacePlans.TeamUnlimited ? 'team' : 'pro'
    const amount = intervalIsYearly.value
      ? (prices.value?.[currency.value]?.[basePlanType]?.yearly.amount || 0) / 12
      : prices.value?.[currency.value]?.[basePlanType]?.monthly.amount || 0

    return formatPrice({
      amount,
      currency: currency.value
    })
  }

  const planPrice = activeWorkspacePrices.value?.[plan.value.name as PaidWorkspacePlans]
  if (!planPrice) return null

  return formatPrice({
    amount: intervalIsYearly.value
      ? planPrice.yearly.amount / 12
      : planPrice.monthly.amount,
    currency: currency.value
  })
})

const newEditorPrice = computed(() => {
  if (!props.plan) return null

  if (
    props.plan === WorkspacePlans.TeamUnlimited ||
    props.plan === WorkspacePlans.ProUnlimited
  ) {
    const basePlanType = props.plan === WorkspacePlans.TeamUnlimited ? 'team' : 'pro'
    const amount =
      props.billingInterval === BillingInterval.Yearly
        ? (prices.value?.[currency.value]?.[basePlanType]?.yearly.amount || 0) / 12
        : prices.value?.[currency.value]?.[basePlanType]?.monthly.amount || 0

    return formatPrice({
      amount,
      currency: currency.value
    })
  }

  const planPrice =
    prices.value?.[currency.value]?.[props.plan]?.[props.billingInterval]
  if (!planPrice) return null

  return formatPrice({
    amount:
      props.billingInterval === BillingInterval.Yearly
        ? planPrice.amount / 12
        : planPrice.amount,
    currency: currency.value
  })
})

const totalPrice = computed(() => {
  const planPrice =
    activeWorkspacePrices.value?.[plan.value?.name as PaidWorkspacePlans]
  if (!planPrice) return null

  return formatPrice({
    amount: intervalIsYearly.value
      ? planPrice.yearly.amount / 12
      : planPrice.monthly.amount,
    currency: currency.value
  })
})

const newTotalPrice = computed(() => {
  const planPrice =
    prices.value?.[currency.value]?.[props.plan]?.[props.billingInterval]
  if (!planPrice) return 0

  return props.billingInterval === BillingInterval.Yearly
    ? planPrice.amount / 12
    : planPrice.amount
})

const newTotalPriceFormatted = computed(() => {
  return formatPrice({
    amount: newTotalPrice.value,
    currency: currency.value
  })
})

const currentAddonPrice = computed(() => {
  if (!plan.value?.name) return null
  const addonPrice =
    addonPrices.value?.[currency.value]?.[plan.value.name as PaidWorkspacePlans]
  if (!addonPrice) return null

  return intervalIsYearly.value
    ? formatPrice({
        amount: addonPrice.yearly.amount / 12,
        currency: addonPrice.yearly.currency
      })
    : formatPrice({
        amount: addonPrice.monthly.amount,
        currency: addonPrice.monthly.currency
      })
})

const newAddonPrice = computed(() => {
  if (!props.plan) return null
  const addonPrice = addonPrices.value?.[currency.value]?.[props.plan]
  if (!addonPrice) return null

  return formatPrice({
    amount:
      props.billingInterval === BillingInterval.Yearly
        ? addonPrice.yearly.amount / 12
        : addonPrice.monthly.amount,
    currency: currency.value
  })
})

const newPlanHasUnlimitedAddon = computed(() =>
  doesPlanIncludeUnlimitedProjectsAddon(props.plan)
)

const newIntervalIsYearly = computed(
  () => props.billingInterval === BillingInterval.Yearly
)
</script>
