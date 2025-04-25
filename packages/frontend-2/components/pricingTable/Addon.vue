<template>
  <CommonCard v-tippy="tooltip || undefined" class="flex flex-col !p-3">
    <span class="text-body-sm font-medium">{{ title }}</span>
    <span class="text-body-xs text-foreground-2">
      {{ text }}
    </span>
  </CommonCard>
</template>

<script setup lang="ts">
import { Currency, BillingInterval } from '~/lib/common/generated/gql/graphql'
import { useWorkspaceAddonPrices } from '~/lib/billing/composables/prices'
import { formatPrice } from '~/lib/billing/helpers/plan'

const props = defineProps<{
  title: string
  basePlan: 'team' | 'pro'
  currency?: Currency
  tooltip?: string
}>()

const { addonPrices } = useWorkspaceAddonPrices()

const text = computed(() => {
  const price = getAddonPrice()
  return price ? `${price} per editor seat / month` : 'Contact us for pricing'
})

const getAddonPrice = () => {
  if (!addonPrices.value) {
    return null
  }

  const currency = props.currency || Currency.Usd

  const price = addonPrices.value[currency][props.basePlan][BillingInterval.Monthly]

  return formatPrice({
    amount: price.amount,
    currency
  })
}
</script>
