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
    </div>
  </div>
</template>
