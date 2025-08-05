<template>
  <div class="md:max-w-5xl md:mx-auto pb-6 md:pb-0 flex flex-col gap-y-2 md:gap-y-4">
    <SettingsSectionHeader
      title="Billing and plans"
      text="Get billing information and upgrade your plan"
    />
    <BillingAlert
      v-if="showBillingAlert"
      class="mb-6"
      :workspace="workspace"
      hide-settings-links
    />
    <BillingUsageAlert
      v-if="reachedPlanLimit"
      :plan-name="workspace?.plan?.name"
      class="mb-6"
    />
    <div class="flex flex-col gap-y-6 md:gap-y-10">
      <section v-if="!isFreePlan" class="flex flex-col gap-y-4 md:gap-y-6">
        <SettingsSectionHeader title="Summary" subheading />
        <SettingsWorkspacesBillingSummary :workspace-id="workspace?.id" />
      </section>

      <section class="flex flex-col gap-y-4 md:gap-y-6">
        <SettingsSectionHeader title="Usage" subheading />
        <SettingsWorkspacesBillingUsage :slug="slug" />
      </section>

      <template v-if="showPricingInfo">
        <ClientOnly>
          <section class="flex flex-col gap-y-4 md:gap-y-6">
            <SettingsSectionHeader title="Upgrade your plan" subheading />
            <PricingTable
              :slug="slug"
              :workspace-id="workspace?.id"
              :role="workspace?.role as WorkspaceRoles"
              :currency="workspace?.subscription?.currency"
              :is-yearly-interval-selected="
                workspace?.subscription?.billingInterval === BillingInterval.Yearly
              "
            />
          </section>

          <section class="flex flex-col gap-y-4 md:gap-y-6">
            <SettingsSectionHeader title="Add-ons" subheading />
            <SettingsWorkspacesBillingAddOns
              :slug="slug"
              :workspace-id="workspace?.id"
            />
          </section>
        </ClientOnly>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useQuery } from '@vue/apollo-composable'
import { settingsWorkspaceBillingQuery } from '~/lib/settings/graphql/queries'
import {
  type WorkspaceRoles,
  workspaceReachedPlanLimit,
  isSelfServeAvailablePlan
} from '@speckle/shared'
import { useWorkspacePlan } from '~~/lib/workspaces/composables/plan'
import { graphql } from '~/lib/common/generated/gql'
import {
  BillingInterval,
  WorkspacePlanStatuses
} from '~/lib/common/generated/gql/graphql'
import { useFeatureFlags } from '~/lib/common/composables/env'

graphql(`
  fragment WorkspaceBillingPage_Workspace on Workspace {
    id
    role
    subscription {
      currency
      billingInterval
    }
    plan {
      name
      usage {
        projectCount
        modelCount
      }
    }
    ...BillingAlert_Workspace
  }
`)

const route = useRoute()
const slug = computed(() => (route.params.slug as string) || '')
const isBillingIntegrationEnabled = useIsBillingIntegrationEnabled()
const featureFlags = useFeatureFlags()

const { isFreePlan } = useWorkspacePlan(slug.value)
const { result: workspaceResult } = useQuery(
  settingsWorkspaceBillingQuery,
  () => ({
    slug: slug.value
  }),
  () => ({
    enabled: isBillingIntegrationEnabled
  })
)

const workspace = computed(() => workspaceResult.value?.workspaceBySlug)
const showBillingAlert = computed(
  () =>
    workspace.value?.plan?.status === WorkspacePlanStatuses.PaymentFailed ||
    workspace.value?.plan?.status === WorkspacePlanStatuses.Canceled ||
    workspace.value?.plan?.status === WorkspacePlanStatuses.CancelationScheduled
)
const reachedPlanLimit = computed(() =>
  workspaceReachedPlanLimit({
    plan: workspace.value?.plan?.name,
    projectCount: workspace.value?.plan?.usage?.projectCount,
    modelCount: workspace.value?.plan?.usage?.modelCount,
    featureFlags
  })
)
const showPricingInfo = computed(() => {
  if (!workspace.value?.plan?.name) return false
  return isSelfServeAvailablePlan(workspace.value.plan.name)
})
</script>
