<template>
  <CommonCard v-tippy="tooltip || undefined" class="flex flex-col !p-3">
    <span class="text-body-sm font-medium">{{ title }}</span>
    <span class="text-body-xs text-foreground-2">
      {{ text }}
    </span>
  </CommonCard>
</template>

<script setup lang="ts">
import { Currency } from '~/lib/common/generated/gql/graphql'
import { useWorkspaceAddonPrices } from '~/lib/billing/composables/prices'
import { formatPrice } from '~/lib/billing/helpers/plan'

const props = defineProps<{
  title: string
  basePlan: 'team' | 'pro'
  isYearlyIntervalSelected: boolean
  currency?: Currency
  tooltip?: string
}>()

const { addonPrices } = useWorkspaceAddonPrices()

const addonPrice = computed(() => {
  if (!addonPrices.value) return null

  const currency = props.currency || Currency.Usd
  const addonPrice = addonPrices.value[currency][props.basePlan]

  if (!addonPrice) return null

  return formatPrice({
    amount: props.isYearlyIntervalSelected
      ? addonPrice.yearly.amount / 12
      : addonPrice.monthly.amount,
    currency
  })
})

const text = computed(() => {
  return addonPrice.value
    ? `${addonPrice.value} per editor seat / month`
    : 'Contact us for pricing'
})
</script>
