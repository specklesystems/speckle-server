<template>
  <table class="w-full flex flex-col text-left">
    <thead>
      <tr class="w-full flex">
        <th class="w-1/4 flex pl-5 pr-6 pt-4 pb-2 font-medium">
          <h4 class="text-body-xs text-foreground">Compare plans</h4>
        </th>
        <th
          v-for="plan in plans"
          :key="`desktop-${plan.name}`"
          class="w-1/4 px-6 pt-4 pb-2"
          :class="[
            plan.name === WorkspacePlans.Starter
              ? 'border border-b-0 border-outline-3 bg-foundation-2 rounded-t-lg'
              : ''
          ]"
          scope="col"
        >
          <SettingsWorkspacesBillingPricingTableHeader
            :plan="plan"
            :is-yearly-plan="isYearlyPlan"
            :current-plan="currentPlan"
            :workspace-id="workspaceId"
            :is-admin="isAdmin"
          />
        </th>
      </tr>
    </thead>
    <tbody class="w-full flex flex-col">
      <tr v-for="(feature, key, index) in features" :key="key" class="flex">
        <th
          class="font-normal text-foreground text-body-xs w-1/4 pr-3 pt-1"
          scope="row"
        >
          <div class="border-b border-outline-3 min-h-[42px] pl-5 flex items-center">
            {{ feature.name }}
          </div>
        </th>
        <td
          v-for="plan in plans"
          :key="plan.name"
          class="px-3 w-1/4 pt-1"
          :class="[
            plan.name === WorkspacePlans.Starter
              ? 'border-l border-r border-outline-3 bg-foundation-2'
              : '',
            plan.name === WorkspacePlans.Starter &&
            index === Object.values(features).length - 1
              ? 'pb-6 border-b rounded-b-lg'
              : ''
          ]"
        >
          <div class="border-b border-outline-3 flex items-center px-3 min-h-[42px]">
            <CheckIcon
              v-if="plan.features.includes(feature.name as PlanFeaturesList)"
              class="w-3 h-3 text-foreground"
            />
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import type { WorkspacePlan } from '~/lib/common/generated/gql/graphql'
import { WorkspacePlans } from '~/lib/common/generated/gql/graphql'
import { pricingPlansConfig } from '~/lib/billing/helpers/constants'
import type { PlanFeaturesList } from '~/lib/billing/helpers/types'
import { CheckIcon } from '@heroicons/vue/24/outline'
import type { MaybeNullOrUndefined } from '@speckle/shared'

defineProps<{
  isYearlyPlan: boolean
  currentPlan?: MaybeNullOrUndefined<WorkspacePlan>
  workspaceId?: string
  isAdmin?: boolean
}>()

const plans = ref(pricingPlansConfig.plans)
const features = ref(pricingPlansConfig.features)
</script>
