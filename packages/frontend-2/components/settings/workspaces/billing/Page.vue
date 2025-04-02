<template>
  <div class="md:max-w-5xl md:mx-auto pb-6 md:pb-0 flex flex-col gap-y-2 md:gap-y-4">
    <SettingsSectionHeader
      title="Billing and plans"
      text="Update your payment information or switch plans according to your needs"
    />
    <CommonAlert v-if="!isNewPlan" color="danger">
      <template #title>You are on an old plan</template>
      <template #description>
        <p>If you are a server admin use the buttons below to upgrade</p>
      </template>
    </CommonAlert>
    <div class="flex flex-col gap-y-6 md:gap-y-10">
      <section v-if="isServerAdmin" class="flex flex-col gap-y-4 md:gap-y-6">
        <div class="flex gap-x-4">
          <FormButton
            size="lg"
            class="!bg-pink-500 !border-pink-700 mb-4"
            @click="handleUpgradeClick(WorkspacePlans.Free)"
          >
            𝕮𝖍𝖆𝖓𝖌𝖊 𝖙𝖔 free 𝖕𝖑𝖆𝖓
          </FormButton>
          <FormButton
            size="lg"
            class="!bg-pink-500 !border-pink-700 mb-4"
            @click="handleUpgradeClick(WorkspacePlans.Team)"
          >
            𝕮𝖍𝖆𝖓𝖌𝖊 𝖙𝖔 Starter 𝖕𝖑𝖆𝖓
          </FormButton>
          <FormButton
            size="lg"
            class="!bg-pink-500 !border-pink-700 mb-4"
            @click="handleUpgradeClick(WorkspacePlans.Pro)"
          >
            𝕮𝖍𝖆𝖓𝖌𝖊 𝖙𝖔 Business 𝖕𝖑𝖆𝖓
          </FormButton>
        </div>
      </section>
      <template v-if="isNewPlan">
        <section v-if="isPurchasablePlan" class="flex flex-col gap-y-4 md:gap-y-6">
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
            :slug="slug"
            :workspace-id="workspace?.id"
            :role="workspace?.role as WorkspaceRoles"
          />
        </section>

        <section class="flex flex-col gap-y-4 md:gap-y-6">
          <SettingsSectionHeader title="Add-ons" subheading />
          <SettingsWorkspacesBillingAddOns :slug="slug" />
        </section>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useQuery, useMutation } from '@vue/apollo-composable'
import { adminUpdateWorkspacePlanMutation } from '~/lib/billing/graphql/mutations'
import { settingsWorkspaceBillingQuery } from '~/lib/settings/graphql/queries'
import {
  WorkspacePlans,
  PaidWorkspacePlanStatuses,
  type WorkspaceRoles
} from '@speckle/shared'
import { useWorkspacePlan } from '~~/lib/workspaces/composables/plan'
import { graphql } from '~/lib/common/generated/gql'

graphql(`
  fragment WorkspaceBillingPage_Workspace on Workspace {
    id
    ...PricingTable_Workspace
  }
`)

const route = useRoute()
const slug = computed(() => (route.params.slug as string) || '')
const { isAdmin: isServerAdmin } = useActiveUser()
const isBillingIntegrationEnabled = useIsBillingIntegrationEnabled()
const { isPurchasablePlan, isNewPlan } = useWorkspacePlan(slug.value)
const { mutate: mutateWorkspacePlan } = useMutation(adminUpdateWorkspacePlanMutation)
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

// Temporary hack to change workspace plans to the new free plan
const handleUpgradeClick = (plan: WorkspacePlans) => {
  if (!workspaceResult.value?.workspaceBySlug.id) return
  mutateWorkspacePlan({
    input: {
      workspaceId: workspaceResult.value.workspaceBySlug.id,
      plan,
      status: PaidWorkspacePlanStatuses.Valid
    }
  })

  // Reload to show the new plan, will be gone soon
  window.location.reload()
}
</script>
