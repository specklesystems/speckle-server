<template>
  <div class="flex flex-col gap-y-6">
    <div class="flex flex-col lg:flex-row justify-between gap-y-4">
      <slot name="title" />
      <div class="flex items-center gap-x-4">
        <p class="text-foreground-3 text-body-xs">Save 20% with annual billing</p>
        <FormSwitch
          v-model="isYearlyPlan"
          :disabled="activeBillingInterval === BillingInterval.Yearly"
          :show-label="false"
          name="annual billing"
        />
      </div>
    </div>

    <SettingsWorkspacesBillingPricingTableDesktop
      v-if="isDesktop"
      :is-yearly-plan="isYearlyPlan"
      v-bind="$props"
      @on-cta-click="$emit('on-cta-click', $event)"
    />
    <SettingsWorkspacesBillingPricingTableMobile
      v-else
      :is-yearly-plan="isYearlyPlan"
      v-bind="$props"
      @on-cta-click="$emit('on-cta-click', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { useBreakpoints } from '@vueuse/core'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import {
  BillingInterval,
  WorkspacePlans,
  type WorkspacePlan
} from '~/lib/common/generated/gql/graphql'
import { graphql } from '~/lib/common/generated/gql'
import type { MaybeNullOrUndefined } from '@speckle/shared'

graphql(`
  fragment SettingsWorkspacesBillingPricingTable_WorkspacePlan on WorkspacePlan {
    name
    status
    createdAt
  }
`)

defineEmits<{
  (
    e: 'on-cta-click',
    v: {
      plan: WorkspacePlans
      billingInterval: BillingInterval
    }
  ): void
}>()

const props = defineProps<{
  workspaceId?: string
  currentPlan?: MaybeNullOrUndefined<WorkspacePlan>
  activeBillingInterval?: BillingInterval
  isAdmin?: boolean
}>()

const breakpoints = useBreakpoints(TailwindBreakpoints)

const isDesktop = breakpoints.greaterOrEqual('lg')
const isYearlyPlan = ref(false)

watch(
  () => props.activeBillingInterval,
  (newVal) => {
    isYearlyPlan.value = newVal === BillingInterval.Yearly
  },
  { immediate: true }
)
</script>
