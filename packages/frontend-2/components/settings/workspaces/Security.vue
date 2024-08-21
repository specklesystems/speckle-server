<template>
  <section>
    <div class="md:max-w-xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader
        title="Security"
        text="Manage verified workspace domains and associated features."
      />
      <div>
        <SettingsSectionHeader title="Workspace domains" subheading />
        <FormButton @click="showAddDomainDialog = true">Add domain</FormButton>
        <LayoutTable
          class="mt-2 md:mt-4"
          :columns="[
            { id: 'domain', header: 'Domain', classes: 'col-span-3' },
            { id: 'delete', header: 'Delete', classes: 'col-span-2' }
          ]"
          :items="workspaceDomains"
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
        <SettingsSectionHeader title="Domain features" subheading class="mt-8" />
        <FormSwitch
          v-model="isDomainProtectionEnabled"
          name="domain-protection"
          label="Enable domain protection"
        />
        <FormSwitch
          v-model="isDomainDiscoverabilityEnabled"
          name="domain-discoverability"
          label="Enable domain discoverability"
        />
      </div>
    </div>
    <SettingsWorkspacesSecurityDomainAddDialog
      v-if="verifiedUser"
      v-model:open="showAddDomainDialog"
      :workspace-id="workspaceId"
      :verified-user="verifiedUser"
    />
    <SettingsWorkspacesSecurityDomainRemoveDialog
      v-if="removeDialogDomain"
      v-model:open="showRemoveDomainDialog"
      :workspace-id="workspaceId"
      :domain="removeDialogDomain"
    />
  </section>
</template>

<script setup lang="ts">
import { useApolloClient, useQuery } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type {
  Workspace,
  SettingsWorkspacesSecurityDomainRemoveDialog_WorkspaceDomainFragment
} from '~/lib/common/generated/gql/graphql'
import { SettingsUpdateWorkspaceSecurityDocument } from '~/lib/common/generated/gql/graphql'
import { getCacheId, getFirstErrorMessage } from '~/lib/common/helpers/graphql'
import { settingsWorkspacesSecurityQuery } from '~/lib/settings/graphql/queries'

graphql(`
  fragment SettingsWorkspacesSecurity_Workspace on Workspace {
    id
    domains {
      ...SettingsWorkspacesSecurityDomainRemoveDialog_WorkspaceDomain
    }
    domainBasedMembershipProtectionEnabled
    discoverabilityEnabled
  }
  fragment SettingsWorkspacesSecurity_User on User {
    ...SettingsWorkspacesSecurityDomainAddDialog_User
  }
`)

const props = defineProps<{
  workspaceId: string
}>()

const { triggerNotification } = useGlobalToast()
const apollo = useApolloClient().client

const showAddDomainDialog = ref(false)

const showRemoveDomainDialog = ref(false)
const removeDialogDomain =
  ref<SettingsWorkspacesSecurityDomainRemoveDialog_WorkspaceDomainFragment>()

const { result: workspaceSecuritySettings } = useQuery(
  settingsWorkspacesSecurityQuery,
  {
    workspaceId: props.workspaceId
  }
)

const verifiedUser = computed(() => {
  return workspaceSecuritySettings.value?.activeUser
})

const workspaceDomains = computed(() => {
  return workspaceSecuritySettings.value?.workspace.domains || []
})

const isDomainProtectionEnabled = computed({
  get: () => workspaceSecuritySettings.value?.workspace.discoverabilityEnabled || false,
  set: async (newVal) => {
    const result = await apollo
      .mutate({
        mutation: SettingsUpdateWorkspaceSecurityDocument,
        variables: {
          input: {
            id: props.workspaceId,
            domainBasedMembershipProtectionEnabled: newVal
          }
        },
        optimisticResponse: {
          workspaceMutations: {
            update: {
              __typename: 'Workspace',
              domainBasedMembershipProtectionEnabled: newVal,
              discoverabilityEnabled:
                workspaceSecuritySettings.value?.workspace.discoverabilityEnabled ||
                false
            }
          }
        },
        update: (cache, res) => {
          const { data } = res
          if (!data?.workspaceMutations) return

          cache.modify<Workspace>({
            id: getCacheId('Workspace', props.workspaceId),
            fields: {
              discoverabilityEnabled: () =>
                res.data?.workspaceMutations.update.discoverabilityEnabled || false
            }
          })
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (!result?.data) {
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to update',
        description: getFirstErrorMessage(result?.errors)
      })
    }
  }
})

const isDomainDiscoverabilityEnabled = computed({
  get: () => workspaceSecuritySettings.value?.workspace.discoverabilityEnabled || false,
  set: async (newVal) => {
    const result = await apollo.mutate({
      mutation: SettingsUpdateWorkspaceSecurityDocument,
      variables: {
        input: {
          id: props.workspaceId,
          discoverabilityEnabled: newVal
        }
      },
      optimisticResponse: {
        workspaceMutations: {
          update: {
            __typename: 'Workspace',
            domainBasedMembershipProtectionEnabled:
              workspaceSecuritySettings.value?.workspace
                .domainBasedMembershipProtectionEnabled || false,
            discoverabilityEnabled: newVal
          }
        }
      },
      update: (cache, res) => {
        const { data } = res
        if (!data?.workspaceMutations) return

        cache.modify<Workspace>({
          id: getCacheId('Workspace', props.workspaceId),
          fields: {
            domainBasedMembershipProtectionEnabled: () =>
              workspaceSecuritySettings.value?.workspace.discoverabilityEnabled || false
          }
        })
      }
    })

    if (!result?.data) {
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to update',
        description: getFirstErrorMessage(result?.errors)
      })
    }
  }
})

const openRemoveDialog = (
  domain: SettingsWorkspacesSecurityDomainRemoveDialog_WorkspaceDomainFragment
) => {
  removeDialogDomain.value = domain
  showRemoveDomainDialog.value = true
}
</script>
