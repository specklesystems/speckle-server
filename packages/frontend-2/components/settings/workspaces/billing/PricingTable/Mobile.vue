<template>
  <div class="flex flex-col gap-y-4">
    <div
      v-for="plan in plans"
      :key="`mobile-${plan.name}`"
      class="border border-outline-3 bg-foundation rounded-lg p-4 pb-2"
    >
      <SettingsWorkspacesBillingPricingTableHeader :plan="plan" v-bind="$props" />
      <ul class="flex flex-col gap-y-2 mt-6">
        <li
          v-for="feature in features"
          :key="feature.name"
          class="flex items-center justify-between border-b last:border-b-0 border-outline-3 pb-2"
        >
          {{ feature.name }}
          <CheckIcon
            v-if="plan.features.includes(feature.name as PlanFeaturesList)"
            class="w-3 h-3 text-foreground"
          />
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WorkspacePlan, BillingInterval } from '~/lib/common/generated/gql/graphql'
import { pricingPlansConfig } from '~/lib/billing/helpers/constants'
import type { PlanFeaturesList } from '~/lib/billing/helpers/types'
import { CheckIcon } from '@heroicons/vue/24/outline'
import type { MaybeNullOrUndefined } from '@speckle/shared'

defineProps<{
  isYearlyPlan: boolean
  currentPlan: MaybeNullOrUndefined<WorkspacePlan>
  workspaceId: string
  isAdmin: boolean
  activeBillingInterval?: BillingInterval
}>()

const plans = ref(pricingPlansConfig.plans)
const features = ref(pricingPlansConfig.features)
</script>
