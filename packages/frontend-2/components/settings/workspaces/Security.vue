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
      <div>
        <SettingsSectionHeader title="Domain Features" subheading class="mt-8" />
        <FormSwitch
          v-model="isDomainProtectionEnabled"
          name="domain-protection"
          label="Enable Domain Protection"
        />
        <FormSwitch
          v-model="isDomainDiscoverabilityEnabled"
          name="domain-discoverability"
          label="Enable Domain Discoverability"
        />
      </div>
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
import { useMutation, useQuery } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type { WorkspaceDomainInfo_SettingsFragment } from '~/lib/common/generated/gql/graphql'
import { getFirstErrorMessage } from '~/lib/common/helpers/graphql'
import { settingsUpdateWorkspaceSecurity } from '~/lib/settings/graphql/mutations'
import { settingsWorkspaceSecurityQuery } from '~/lib/settings/graphql/queries'

graphql(`
  fragment WorkspaceDomainInfo_Settings on WorkspaceDomain {
    id
    domain
  }
`)

const props = defineProps<{
  workspaceId: string
}>()

const { triggerNotification } = useGlobalToast()

const { result, refetch } = useQuery(settingsWorkspaceSecurityQuery, {
  workspaceId: props.workspaceId
})
const { mutate: updateWorkspaceSecurity } = useMutation(settingsUpdateWorkspaceSecurity)

const domains = ref<WorkspaceDomainInfo_SettingsFragment[]>([])

const showAddDialog = ref(false)
const handleDomainsChanged = (nextDomains: WorkspaceDomainInfo_SettingsFragment[]) => {
  domains.value = nextDomains
  refetch()
}

const showRemoveDialog = ref(false)
const removeDialogDomain = ref<WorkspaceDomainInfo_SettingsFragment>()
const openRemoveDialog = (domain: WorkspaceDomainInfo_SettingsFragment) => {
  removeDialogDomain.value = domain
  showRemoveDialog.value = true
}

const isDomainProtectionEnabledInternal = ref(false)
const isDomainProtectionEnabled = computed({
  get: () => isDomainProtectionEnabledInternal.value,
  set: async (newVal) => {
    isDomainProtectionEnabledInternal.value = newVal

    const result = await updateWorkspaceSecurity({
      input: {
        id: props.workspaceId,
        domainBasedMembershipProtectionEnabled: newVal
      }
    })

    if (!result?.data) {
      const errorMessage = getFirstErrorMessage(result?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to update',
        description: errorMessage
      })
      return
    }

    isDomainProtectionEnabledInternal.value =
      result.data.workspaceMutations.update.domainBasedMembershipProtectionEnabled
  }
})

const isDomainDiscoverabilityEnabledInternal = ref(false)
const isDomainDiscoverabilityEnabled = computed({
  get: () => isDomainDiscoverabilityEnabledInternal.value,
  set: async (newVal) => {
    isDomainDiscoverabilityEnabledInternal.value = newVal

    const result = await updateWorkspaceSecurity({
      input: {
        id: props.workspaceId,
        discoverabilityEnabled: newVal
      }
    })

    if (!result?.data) {
      const errorMessage = getFirstErrorMessage(result?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to update',
        description: errorMessage
      })
      return
    }

    isDomainDiscoverabilityEnabledInternal.value =
      result.data.workspaceMutations.update.discoverabilityEnabled
  }
})

watch(result, (value) => {
  domains.value = value?.workspace.domains ?? []
  isDomainProtectionEnabledInternal.value =
    value?.workspace.domainBasedMembershipProtectionEnabled ?? false
  isDomainDiscoverabilityEnabledInternal.value =
    value?.workspace.domainBasedMembershipProtectionEnabled ?? false
})
</script>
