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

    <SettingsWorkspacesBillingPricingTableDesktop
      :is-yearly-plan="isYearlyPlan"
      :current-plan="props.currentPlan"
      :workspace-id="props.workspaceId"
    />
  </div>
</template>

<script setup lang="ts">
import {
  WorkspacePlanStatuses,
  type WorkspacePlan
} from '~/lib/common/generated/gql/graphql'
import { graphql } from '~/lib/common/generated/gql'

graphql(`
  fragment SettingsWorkspacesBillingPricingTable_WorkspacePlan on WorkspacePlan {
    name
    status
  }
`)

const props = defineProps<{
  workspaceId: string
  currentPlan: WorkspacePlan
}>()

const isYearlyPlan = ref(false)

const hasTrialPlan = computed(
  () => props.currentPlan?.status === WorkspacePlanStatuses.Trial || !props.currentPlan
)
</script>
