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
    />
    <SettingsWorkspacesSecurityRemoveDialog
      v-if="removeDialogDomain"
      v-model:open="showRemoveDialog"
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
  WorkspaceSettingsSecurity_WorkspaceDomainFragment
} from '~/lib/common/generated/gql/graphql'
import { SettingsUpdateWorkspaceSecurityDocument } from '~/lib/common/generated/gql/graphql'
import { getCacheId, getFirstErrorMessage } from '~/lib/common/helpers/graphql'
import { settingsWorkspaceSecurityQuery } from '~/lib/settings/graphql/queries'

graphql(`
  fragment WorkspaceSettingsSecurity_WorkspaceDomain on WorkspaceDomain {
    id
    domain
  }
`)

const props = defineProps<{
  workspaceId: string
}>()

const { triggerNotification } = useGlobalToast()
const apollo = useApolloClient().client

const { result: workspaceSecuritySettings } = useQuery(settingsWorkspaceSecurityQuery, {
  workspaceId: props.workspaceId
})
const domains = ref<WorkspaceSettingsSecurity_WorkspaceDomainFragment[]>([])

const showAddDialog = ref(false)

const showRemoveDialog = ref(false)
const removeDialogDomain = ref<WorkspaceSettingsSecurity_WorkspaceDomainFragment>()
const openRemoveDialog = (
  domain: WorkspaceSettingsSecurity_WorkspaceDomainFragment
) => {
  removeDialogDomain.value = domain
  showRemoveDialog.value = true
}

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
</script>
