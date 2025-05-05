<template>
  <div>
    <FormRadioGroup v-model="includeUnlimitedAddon" :options="options" is-stacked />
  </div>
</template>

<script lang="ts" setup>
import { useWorkspacePlan } from '~/lib/workspaces/composables/plan'
import type { PaidWorkspacePlans } from '@speckle/shared'
import { BillingInterval } from '~/lib/common/generated/gql/graphql'
import { formatPrice } from '~/lib/billing/helpers/plan'
import { useWorkspaceAddonPrices } from '~/lib/billing/composables/prices'
import { FormRadioGroup } from '@speckle/ui-components'

type AddonIncludedSelect = 'yes' | 'no'

const props = defineProps<{
  slug: string
  plan: PaidWorkspacePlans
  billingInterval: BillingInterval
  enableNoOption: boolean
}>()
const includeUnlimitedAddon = defineModel<AddonIncludedSelect | undefined>(
  'includeUnlimitedAddon',
  {
    default: null
  }
)

const options = computed(() => [
  {
    value: 'yes',
    title: `Yes${props.enableNoOption ? '' : ' (required)'}`,
    subtitle: `Plus ${addOnPrice.value} per editor seat/month`
  },
  {
    value: 'no',
    title: 'No, maybe later',
    disabled: !props.enableNoOption
  }
])

const { addonPrices } = useWorkspaceAddonPrices()
const { currency } = useWorkspacePlan(props.slug)

const addOnPrice = computed(() => {
  if (!props.plan) return null
  const price = addonPrices.value?.[currency.value]?.[props.plan]
  if (!price) return null

  return formatPrice({
    amount:
      props.billingInterval === BillingInterval.Yearly
        ? price.yearly.amount / 12
        : price.monthly.amount,
    currency: currency.value
  })
})
</script>
