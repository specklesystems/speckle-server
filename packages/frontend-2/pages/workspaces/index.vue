<template>
  <div class="flex flex-col gap-12">
    <WorkspacesPromoBanner />

    <section>
      <div class="flex justify-between mb-2">
        <h4 class="text-foreground-2 text-heading-sm">In a nutshell</h4>
        <FormButton>Create workspace</FormButton>
      </div>

      <div class="mt-8 grid grid-cols-6 gap-12 sm:gap-16">
        <WorkspacesPromoCard
          title="A space for your entire team"
          description="Manage your Connectors and Accounts with ease. Get latest updates without"
          class="col-span-6 sm:col-span-3"
        >
          <template #image>
            <div class="h-56 border border-outline rounded-lg bg-foundation-2">
              <NuxtImg
                src="workspaces.png"
                alt="Introducing Workspaces"
                class="w-full h-full object-cover"
              />
            </div>
          </template>
        </WorkspacesPromoCard>

        <WorkspacesPromoCard
          title="All your projects in one place"
          description="Manage your Connectors and Accounts with ease. Get latest updates without"
          class="col-span-6 sm:col-span-3"
        >
          <template #image>
            <div class="h-56 border border-outline rounded-lg bg-foundation-2">
              <NuxtImg
                src="workspaces.png"
                alt="Introducing Workspaces"
                class="w-full h-full object-cover"
              />
            </div>
          </template>
        </WorkspacesPromoCard>

        <WorkspacesPromoCard
          title="Security / SSO (coming soon!)"
          description="Manage your Connectors and Accounts with ease. Get latest updates without"
          class="col-span-6 sm:col-span-2"
        >
          <template #image>
            <NuxtImg
              src="workspaces.png"
              alt="Introducing Workspaces"
              class="w-full h-full object-cover"
            />
          </template>
        </WorkspacesPromoCard>

        <WorkspacesPromoCard
          title="Security / SSO (coming soon!)"
          description="Manage your Connectors and Accounts with ease. Get latest updates without"
          class="col-span-6 sm:col-span-2"
        >
          <template #image>
            <NuxtImg
              src="workspaces.png"
              alt="Introducing Workspaces"
              class="w-full h-full object-cover"
            />
          </template>
        </WorkspacesPromoCard>

        <WorkspacesPromoCard
          title="Security / SSO (coming soon!)"
          description="Manage your Connectors and Accounts with ease. Get latest updates without"
          class="col-span-6 sm:col-span-2"
        >
          <template #image>
            <NuxtImg
              src="workspaces.png"
              alt="Introducing Workspaces"
              class="w-full h-full object-cover"
            />
          </template>
        </WorkspacesPromoCard>
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
definePageMeta({
  middleware: ['requires-workspaces-enabled']
})
</script>
