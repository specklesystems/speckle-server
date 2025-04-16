<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
    <SettingsWorkspacesBillingAddOnsCard
      title="Unlimited projects and models"
      info="Power through with unlimited projects and models in your workspace."
      disclaimer="Only on Starter & Business"
      :buttons="[unlimitedAddOnButton]"
    >
      <template #subtitle>
        <p class="text-foreground-3 text-body-sm pt-1">
          {{ addonPrice }} per editor seat/month
        </p>
        <div class="flex items-center gap-x-2 mt-3 px-1">
          <FormSwitch
            v-model="isYearlyIntervalSelected"
            :show-label="false"
            name="billing-interval"
            :disabled="hasUnlimitedAddon"
          />
          <span class="text-body-2xs">Billed yearly</span>
          <CommonBadge rounded color-classes="text-foreground-2 bg-primary-muted">
            -10%
          </CommonBadge>
        </div>
      </template>
    </SettingsWorkspacesBillingAddOnsCard>

    <SettingsWorkspacesBillingAddOnsCard
      title="Extra data regions"
      info="Unlock per-project data residency by adding additional data regions to your workspace."
      disclaimer="Only on Business plan"
      :buttons="[contactButton]"
    >
      <template #subtitle>
        <p class="text-foreground-3 text-body-sm pt-1">
          {{ currency === Currency.Gbp ? '£' : '$' }}500 per region/year
        </p>
      </template>
    </SettingsWorkspacesBillingAddOnsCard>

    <SettingsWorkspacesBillingAddOnsCard
      title="Priority support"
      subtitle="Talk to us"
      info="White-glove treatment with private support channel, onboarding calls and more."
      disclaimer="Only on Business plan"
      :buttons="[contactButton]"
    />

    <SettingsWorkspacesBillingUpgradeDialog
      v-model:open="isUpgradeDialogOpen"
      :slug="props.slug"
      :plan="planToUpgrade"
      :billing-interval="
        isYearlyIntervalSelected ? BillingInterval.Yearly : BillingInterval.Monthly
      "
      :workspace-id="workspaceId"
    />
  </div>
</template>

<script lang="ts" setup>
import { useWorkspacePlan } from '~~/lib/workspaces/composables/plan'
import { useWorkspaceAddonPrices } from '~/lib/billing/composables/prices'
import { formatPrice } from '~/lib/billing/helpers/plan'
import { PaidWorkspacePlansNew, type MaybeNullOrUndefined } from '@speckle/shared'
import { BillingInterval, Currency } from '~/lib/common/generated/gql/graphql'
import { useActiveWorkspace } from '~/lib/workspaces/composables/activeWorkspace'

const props = defineProps<{
  slug: string
  workspaceId: MaybeNullOrUndefined<string>
}>()
const isYearlyIntervalSelected = defineModel<boolean>('isYearlyIntervalSelected', {
  default: false
})

const { isPaidPlan, currency, plan, intervalIsYearly, hasUnlimitedAddon } =
  useWorkspacePlan(props.slug)
const { addonPrices } = useWorkspaceAddonPrices()
const { isAdmin } = useActiveWorkspace(props.slug)

const isUpgradeDialogOpen = ref(false)

const contactButton = computed(() => ({
  text: 'Contact us',
  id: 'contact-us',
  onClick: () => {
    window.location.href = 'mailto:billing@speckle.systems'
  }
}))

const unlimitedAddOnButton = computed(() => ({
  text: 'Buy add-on',
  id: 'buy-add-on',
  disabled:
    !isPaidPlan.value ||
    (!isYearlyIntervalSelected.value && intervalIsYearly.value) ||
    hasUnlimitedAddon.value ||
    !isAdmin.value,
  onClick: () => {
    isUpgradeDialogOpen.value = true
  }
}))

const planToUpgrade = computed(() => {
  return plan.value?.name === PaidWorkspacePlansNew.Team
    ? PaidWorkspacePlansNew.TeamUnlimited
    : PaidWorkspacePlansNew.ProUnlimited
})

const addonPrice = computed(() => {
  if (!plan.value) return null
  const addonPrice =
    addonPrices.value?.[currency.value]?.[plan.value.name as PaidWorkspacePlansNew]
  if (!addonPrice) return null

  return formatPrice({
    amount: isYearlyIntervalSelected.value
      ? addonPrice.yearly.amount / 12
      : addonPrice.monthly.amount,
    currency: currency.value
  })
})
</script>
