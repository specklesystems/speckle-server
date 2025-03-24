<template>
  <div class="flex flex-col lg:grid lg:grid-cols-3 gap-4 w-full">
    <PricingTablePlan
      v-for="plan in plans"
      :key="plan"
      :plan="plan"
      :current-plan="currentPlan"
      :yearly-interval-selected="isYearlySelected"
      :active-billing-interval="billingInterval"
      :is-admin="isAdmin"
      :workspace-id="props.workspaceId"
      :has-subscription="!!subscription"
      @on-yearly-interval-selected="onYearlyIntervalSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { BillingInterval } from '~/lib/common/generated/gql/graphql'
import { WorkspacePlans } from '@speckle/shared'
import { useWorkspacePlan } from '~~/lib/workspaces/composables/plan'
import { graphql } from '~/lib/common/generated/gql'
import { type MaybeNullOrUndefined, type WorkspaceRoles, Roles } from '@speckle/shared'

graphql(`
  fragment PricingTable_Workspace on Workspace {
    id
    role
  }
`)

const props = defineProps<{
  slug: string
  role: MaybeNullOrUndefined<WorkspaceRoles>
  workspaceId: MaybeNullOrUndefined<string>
}>()

const {
  billingInterval,
  plan: currentPlan,
  subscription
} = useWorkspacePlan(props.slug)

const isYearlySelected = ref(false)

const plans = computed(() => [
  WorkspacePlans.Free,
  WorkspacePlans.Team,
  WorkspacePlans.Pro
])

const isAdmin = computed(() => props.role === Roles.Workspace.Admin)

const onYearlyIntervalSelected = (newValue: boolean) => {
  isYearlySelected.value = newValue
}

watch(
  () => billingInterval.value,
  (newVal) => {
    isYearlySelected.value = newVal === BillingInterval.Yearly
  },
  { immediate: true }
)
</script>
