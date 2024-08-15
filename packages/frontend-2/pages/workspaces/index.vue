<template>
  <div class="flex flex-col gap-12">
    <WorkspacesPromoBanner />

    <section>
      <div class="flex justify-between">
        <h4 class="text-foreground-2 text-heading-sm">In a nutshell</h4>
        <FormButton>Create workspace</FormButton>
      </div>

      <div class="mt-4 grid grid-cols-6 gap-12 sm:gap-16">
        <WorkspacesPromoCard
          title="A space for your entire team"
          description="Manage your Connectors and Accounts with ease. Get latest updates without"
          class="col-span-6 sm:col-span-3"
        />
        <WorkspacesPromoCard
          title="All your projects in one place"
          description="Manage your Connectors and Accounts with ease. Get latest updates without"
          class="col-span-6 sm:col-span-3"
        />
        <WorkspacesPromoCard
          title="Security / SSO (coming soon!)"
          description="Manage your Connectors and Accounts with ease. Get latest updates without"
          class="col-span-6 sm:col-span-2"
        />
        <WorkspacesPromoCard
          title="Security / SSO (coming soon!)"
          description="Manage your Connectors and Accounts with ease. Get latest updates without"
          class="col-span-6 sm:col-span-2"
        />
        <WorkspacesPromoCard
          title="Security / SSO (coming soon!)"
          description="Manage your Connectors and Accounts with ease. Get latest updates without"
          class="col-span-6 sm:col-span-2"
        />
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
definePageMeta({
  middleware: ['requires-workspaces-enabled']
})
</script>
