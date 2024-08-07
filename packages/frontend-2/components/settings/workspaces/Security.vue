<template>
  <section>
    <div class="md:max-w-xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader title="Security" text="Be secure 😤" />
      <div>
        <SettingsSectionHeader title="Workspace Domains" subheading />
        <div
          class="flex flex-col-reverse md:justify-between md:flex-row md:gap-x-4 mt-4"
        >
          <FormButton @click="showAddDialog = true">Add Domain</FormButton>
        </div>
        <LayoutTable
          class="mt-2 md:mt-4"
          :columns="[
            { id: 'domain', header: 'Domain', classes: 'col-span-3' },
            { id: 'delete', header: 'Delete', classes: 'col-span-2' }
          ]"
          :items="domains"
        >
          <template #domain="{ item }">
            <span class="text-body-xs text-foreground">
              {{ `@${item.domain}` }}
            </span>
          </template>
          <template #delete="{ item }">
            <FormButton color="danger" @click="() => openRemoveDialog(item)">
              Delete
            </FormButton>
          </template>
        </LayoutTable>
      </div>
      <!-- <div>
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
        <FormButton class="mt-4">Save</FormButton>
      </div> -->
    </div>
    <SettingsWorkspacesSecurityAddDialog
      v-model:open="showAddDialog"
      :workspace-id="workspaceId"
      @added="handleDomainsChanged"
    />
    <SettingsWorkspacesSecurityRemoveDialog
      v-if="removeDialogDomain"
      v-model:open="showRemoveDialog"
      :workspace-id="workspaceId"
      :domain="removeDialogDomain"
      @removed="handleDomainsChanged"
    />
  </section>
</template>

<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql'
import type { WorkspaceDomainInfo_SettingsFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment WorkspaceDomainInfo_Settings on WorkspaceDomain {
    id
    domain
  }
`)

defineProps<{
  workspaceId: string
}>()

const domains = ref<WorkspaceDomainInfo_SettingsFragment[]>([])

const showAddDialog = ref(false)
const handleDomainsChanged = (nextDomains: WorkspaceDomainInfo_SettingsFragment[]) => {
  domains.value = nextDomains
}

const showRemoveDialog = ref(false)
const removeDialogDomain = ref<WorkspaceDomainInfo_SettingsFragment>()
const openRemoveDialog = (domain: WorkspaceDomainInfo_SettingsFragment) => {
  removeDialogDomain.value = domain
  showRemoveDialog.value = true
}

// const isDomainProtectionEnabled = ref(false)
// const isWorkspaceDiscoveryEnabled = ref(false)
</script>
