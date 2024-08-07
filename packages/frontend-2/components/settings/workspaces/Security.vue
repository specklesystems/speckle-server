<template>
  <section>
    <div class="md:max-w-xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader title="Security" text="Be secure 😤" />
      <div>
        <SettingsSectionHeader title="Workspace Domains" subheading />
        <div
          class="flex flex-col-reverse md:justify-between md:flex-row md:gap-x-4 mt-4"
        >
          <FormButton>Add Domain</FormButton>
        </div>
        <LayoutTable
          class="mt-2 md:mt-4"
          :columns="[
            { id: 'domain', header: 'Domain', classes: 'col-span-3' },
            { id: 'verified', header: 'Status', classes: 'col-span-3' }
          ]"
          :items="domains"
        >
          <template #domain="{ item }">
            <span class="text-body-xs text-foreground">
              {{ item.domain }}
            </span>
          </template>
          <template #verified="{ item }">
            <span class="text-body-xs text-foreground-2">
              {{ item.verified ? 'Verified' : 'Unverified' }}
            </span>
          </template>
        </LayoutTable>
      </div>
      <div>
        <SettingsSectionHeader title="Domain Features" subheading class="mt-8" />
        <FormCheckbox
          v-model="isDomainProtectionEnabled"
          label="Enable Domain Protection"
          name="domain-protection"
        />
        <FormCheckbox
          v-model="isWorkspaceDiscoveryEnabled"
          label="Enable Workspace Discovery"
          name="workspace-discovery"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const domains = [
  {
    id: 'a',
    domain: '@speckle.systems',
    verified: true
  },
  {
    id: 'b',
    domain: '@example.org',
    verified: false
  }
]

const isDomainProtectionEnabled = ref(false)
const isWorkspaceDiscoveryEnabled = ref(false)
</script>
