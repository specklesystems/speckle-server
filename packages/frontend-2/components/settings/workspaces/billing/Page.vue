<template>
  <div class="md:max-w-5xl md:mx-auto pb-6 md:pb-0 flex flex-col gap-y-2 md:gap-y-4">
    <SettingsSectionHeader
      title="Billing and plans"
      text="Update your payment information or switch plans according to your needs"
    />
    <div class="flex flex-col gap-y-6 md:gap-y-10">
      <section v-if="isNewPlan && !isFreePlan" class="flex flex-col gap-y-4 md:gap-y-6">
        <SettingsSectionHeader title="Summary" subheading />
        <SettingsWorkspacesBillingSummary :workspace-id="workspace?.id" />
      </section>

      <section class="flex flex-col gap-y-4 md:gap-y-6">
        <SettingsSectionHeader title="Usage" subheading />
        <SettingsWorkspacesBillingUsage :slug="slug" />
      </section>

      <section class="flex flex-col gap-y-4 md:gap-y-6">
        <SettingsSectionHeader title="Upgrade your plan" subheading />
        <PricingTable
          v-model:is-yearly-interval-selected="isYearlyIntervalSelected"
          :slug="slug"
          :workspace-id="workspace?.id"
          :role="workspace?.role as WorkspaceRoles"
          :currency="workspace?.subscription?.currency"
        />
      </section>

      <section class="flex flex-col gap-y-4 md:gap-y-6">
        <SettingsSectionHeader title="Add-ons" subheading />
        <SettingsWorkspacesBillingAddOns
          v-model:is-yearly-interval-selected="isYearlyIntervalSelected"
          :slug="slug"
          :workspace-id="workspace?.id"
        />
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useQuery } from '@vue/apollo-composable'
import { settingsWorkspaceBillingQuery } from '~/lib/settings/graphql/queries'
import type { WorkspaceRoles } from '@speckle/shared'
import { useWorkspacePlan } from '~~/lib/workspaces/composables/plan'
import { graphql } from '~/lib/common/generated/gql'

graphql(`
  fragment WorkspaceBillingPage_Workspace on Workspace {
    id
    role
    subscription {
      currency
    }
  }
`)

const isYearlyIntervalSelected = defineModel<boolean>('isYearlyIntervalSelected', {
  default: false
})

const route = useRoute()
const slug = computed(() => (route.params.slug as string) || '')
const isBillingIntegrationEnabled = useIsBillingIntegrationEnabled()
const { isFreePlan, isNewPlan, intervalIsYearly } = useWorkspacePlan(slug.value)
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
watch(
  () => intervalIsYearly.value,
  (newVal) => {
    isYearlyIntervalSelected.value = newVal
  },
  { immediate: true }
)
</script>
