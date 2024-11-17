<template>
  <div class="flex flex-col gap-y-6">
    <div class="flex justify-between">
      <SettingsSectionHeader
        :title="hasTrialPlan ? 'Start your subscription' : 'Upgrade your plan'"
        subheading
      />
      <div class="flex items-center gap-x-4">
        <p class="text-foreground-3 text-body-xs">Save 20% with annual billing</p>
        <FormSwitch v-model="isYearlyPlan" :show-label="false" name="annual billing" />
      </div>
    </div>

    <table class="w-full flex flex-col">
      <thead>
        <tr class="w-full flex">
          <th class="w-1/4 flex pl-5 pr-6 pt-4 pb-2 font-medium">
            <h4>Compare plans</h4>
          </th>
          <th
            v-for="plan in pricingPlans"
            :key="plan.name"
            class="w-1/4 flex flex-col gap-y-1 px-6 pt-4 pb-2 font-normal"
            :class="[
              plan.name === WorkspacePlans.Team
                ? 'border border-b-0 border-outline-3 bg-foundation-2 rounded-t-lg'
                : ''
            ]"
            scope="col"
          >
            <h4 class="text-foreground text-body-xs">
              Workspace
              <span class="capitalize">{{ plan.name }}</span>
            </h4>
            <p class="text-foreground text-heading font-normal">
              £{{
                isYearlyPlan
                  ? plan.cost.yearly[Roles.Workspace.Member]
                  : plan.cost.monthly[Roles.Workspace.Member]
              }}
              per seat/month
            </p>
            <p class="text-foreground-2 text-body-2xs pt-1">
              Billed {{ isYearlyPlan ? 'anually' : 'monthly' }}
            </p>
            <FormButton
              :color="plan.name === WorkspacePlans.Team ? 'primary' : 'outline'"
              :disabled="!hasTrialPlan && !canUpgradeToPlan(plan.name)"
              class="mt-3"
              @click="onUpgradePlanClick(plan.name)"
            >
              {{ hasTrialPlan ? 'Subscribe' : 'Upgrade' }} to&nbsp;
              <span class="capitalize">{{ plan.name }}</span>
            </FormButton>
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
            v-for="plan in pricingPlans"
            :key="plan.name"
            class="px-3 w-1/4 pt-1"
            :class="[
              plan.name === WorkspacePlans.Team
                ? 'border-l border-r border-outline-3 bg-foundation-2'
                : '',
              plan.name === WorkspacePlans.Team &&
              index === Object.values(features).length - 1
                ? 'pb-6 border-b rounded-b-lg'
                : ''
            ]"
          >
            <div class="border-b border-outline-3 flex items-center px-3 min-h-[42px]">
              <CheckIcon
                v-if="plan.features.includes(feature.name)"
                class="w-3 h-3 text-foreground"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { SettingsWorkspacesBillingPricingTable_WorkspacePlanFragment } from '~/lib/common/generated/gql/graphql'
import {
  WorkspacePlans,
  BillingInterval,
  WorkspacePlanStatuses
} from '~/lib/common/generated/gql/graphql'
import { pricingPlansConfig } from '~/lib/billing/helpers/constants'
import { CheckIcon } from '@heroicons/vue/24/outline'
import { useBillingActions } from '~/lib/billing/composables/actions'
import { graphql } from '~/lib/common/generated/gql'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { Roles } from '@speckle/shared'

graphql(`
  fragment SettingsWorkspacesBillingPricingTable_WorkspacePlan on WorkspacePlan {
    name
    status
  }
`)

const props = defineProps<{
  workspaceId: string
  currentPlan: MaybeNullOrUndefined<SettingsWorkspacesBillingPricingTable_WorkspacePlanFragment>
}>()

const { upgradePlanRedirect } = useBillingActions()

const pricingPlans = ref([
  pricingPlansConfig.plans[WorkspacePlans.Team],
  pricingPlansConfig.plans[WorkspacePlans.Pro],
  pricingPlansConfig.plans[WorkspacePlans.Business]
])
const features = ref(pricingPlansConfig.features)
const isYearlyPlan = ref(false)

const onUpgradePlanClick = (plan: WorkspacePlans) => {
  upgradePlanRedirect({
    plan,
    cycle: isYearlyPlan.value ? BillingInterval.Yearly : BillingInterval.Monthly,
    workspaceId: props.workspaceId
  })
}

const hasTrialPlan = computed(
  () => props.currentPlan?.status === WorkspacePlanStatuses.Trial || !props.currentPlan
)

const canUpgradeToPlan = (plan: WorkspacePlans) => {
  if (!props.currentPlan?.name) return false

  const allowedUpgrades: Record<WorkspacePlans, WorkspacePlans[]> = {
    [WorkspacePlans.Team]: [WorkspacePlans.Pro, WorkspacePlans.Business],
    [WorkspacePlans.Pro]: [WorkspacePlans.Business],
    [WorkspacePlans.Business]: [],
    [WorkspacePlans.Academia]: [],
    [WorkspacePlans.Unlimited]: []
  }

  return allowedUpgrades[props.currentPlan.name]?.includes(plan) ?? false
}
</script>
