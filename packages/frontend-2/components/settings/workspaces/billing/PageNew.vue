<!-- This is a temporary component and will replace SettingsWorkspacesBillingPage post-migration -->
<template>
  <div class="md:max-w-5xl md:mx-auto pb-6 md:pb-0 flex flex-col gap-y-2 md:gap-y-4">
    <SettingsSectionHeader
      title="Billing and plans"
      text="Update your payment information or switch plans according to your needs"
    />

    <div class="flex flex-col gap-y-6 md:gap-y-10">
      <section class="flex flex-col gap-y-4 md:gap-y-6">
        <SettingsSectionHeader title="Summary" subheading />
        <SettingsWorkspacesBillingSummary />
      </section>

      <section class="flex flex-col gap-y-4 md:gap-y-6">
        <SettingsSectionHeader title="Usage" subheading />
        <SettingsWorkspacesBillingUsage />
      </section>

      <section class="flex flex-col gap-y-4 md:gap-y-6">
        <SettingsSectionHeader title="Add-ons" subheading />
        <SettingsWorkspacesBillingAddOns />
      </section>

      <!-- Temporary until we can test with real upgrades -->
      <section v-if="isServerAdmin" class="flex flex-col gap-y-4 md:gap-y-6">
        <SettingsSectionHeader title="Upgrade plan" subheading />
        <div class="flex gap-x-4">
          <FormButton
            size="lg"
            class="!bg-pink-500 !border-pink-700 mb-4"
            @click="handleUpgradeClick(WorkspacePlans.Free)"
          >
            𝕮𝖍𝖆𝖓𝖌𝖊 𝖙𝖔 𝖋𝖗𝖊𝖊 𝖕𝖑𝖆𝖓
          </FormButton>
          <FormButton
            size="lg"
            class="!bg-pink-500 !border-pink-700 mb-4"
            @click="handleUpgradeClick(WorkspacePlans.Team)"
          >
            𝕮𝖍𝖆𝖓𝖌𝖊 𝖙𝖔 𝖙𝖊𝖆𝖒 𝖕𝖑𝖆𝖓
          </FormButton>
          <FormButton
            size="lg"
            class="!bg-pink-500 !border-pink-700 mb-4"
            @click="handleUpgradeClick(WorkspacePlans.Pro)"
          >
            𝕮𝖍𝖆𝖓𝖌𝖊 𝖙𝖔 𝖕𝖗𝖔 𝖕𝖑𝖆𝖓
          </FormButton>
        </div>
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useQuery, useMutation } from '@vue/apollo-composable'
import { adminUpdateWorkspacePlanMutation } from '~/lib/billing/graphql/mutations'
import { settingsWorkspaceBillingQueryNew } from '~/lib/settings/graphql/queries'
import { WorkspacePlans, PaidWorkspacePlanStatuses } from '@speckle/shared'

const route = useRoute()
const slug = computed(() => (route.params.slug as string) || '')
const { isAdmin: isServerAdmin } = useActiveUser()
const isBillingIntegrationEnabled = useIsBillingIntegrationEnabled()
const { mutate: mutateWorkspacePlan } = useMutation(adminUpdateWorkspacePlanMutation)
const { result: workspaceResult } = useQuery(
  settingsWorkspaceBillingQueryNew,
  () => ({
    slug: slug.value
  }),
  () => ({
    enabled: isBillingIntegrationEnabled
  })
)

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
