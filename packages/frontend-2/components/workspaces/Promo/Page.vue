<template>
  <div class="flex flex-col gap-12">
    <WorkspacesPromoBanner @create="openWorkspaceCreateDialog" />
    <section>
      <div class="flex justify-between mb-2">
        <h4 class="text-foreground text-heading">In a nutshell</h4>
        <FormButton @click="openWorkspaceCreateDialog">Create workspace</FormButton>
      </div>

      <div class="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <CommonCard
          title="A space for your entire team"
          description="Safely collaborate with your entire team and manage guests: workspaces are the perfect home for departments and companies."
        >
          <template #icon>
            <UserGroupIcon class="size-6 text-foreground-2 ml-1" />
          </template>
        </CommonCard>

        <CommonCard
          title="Domain security & discoverability"
          description="Manage your team and allow them to join your workspace automatically based on email domain policies."
        >
          <template #icon>
            <LockClosedIcon class="size-6 text-foreground-2 ml-1" />
          </template>
        </CommonCard>

        <CommonCard
          title="SSO"
          description="Ensure compliance and security with workspace based SSO."
        >
          <template #icon>
            <KeyIcon class="size-6 text-foreground-2 ml-1" />
          </template>
        </CommonCard>

        <CommonCard
          title="Data residency"
          description="Store your workspace projects in the geographical region of your choice."
        >
          <template #icon>
            <GlobeAltIcon class="size-6 text-foreground-2 ml-1" />
          </template>
        </CommonCard>

        <CommonCard
          title="... and more!"
          description="We will be rolling out new features, like advanced permissions, audit logs, and more over the coming months."
        >
          <template #icon>
            <PlusIcon class="size-6 text-foreground-2 ml-1" />
          </template>
        </CommonCard>
      </div>
    </section>

    <section>
      <SettingsWorkspacesBillingPricingTable>
        <template #title>
          <h4 class="text-foreground text-heading">Pricing</h4>
        </template>
      </SettingsWorkspacesBillingPricingTable>
    </section>

    <WorkspaceCreateDialog
      v-model:open="showWorkspaceCreateDialog"
      navigate-on-success
      event-source="promo-page"
    />
  </div>
</template>
<script setup lang="ts">
import { useMixpanel } from '~~/lib/core/composables/mp'
import {
  UserGroupIcon,
  LockClosedIcon,
  KeyIcon,
  GlobeAltIcon,
  PlusIcon
} from '@heroicons/vue/24/outline'

const showWorkspaceCreateDialog = ref(false)

const mixpanel = useMixpanel()

const openWorkspaceCreateDialog = () => {
  showWorkspaceCreateDialog.value = true
  mixpanel.track('Create Workspace Button Clicked', {
    source: 'promo-page'
  })
}
</script>
