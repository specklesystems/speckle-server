<template>
  <section>
    <div class="md:max-w-xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader
        title="Security"
        text="Manage verified workspace domains and associated features."
      />
      <template v-if="isSsoEnabled">
        <SettingsWorkspacesSecuritySsoWrapper
          v-if="result?.workspace"
          :workspace="result.workspace"
        />
        <hr class="my-6 md:my-8 border-outline-2" />
      </template>
      <section>
        <SettingsSectionHeader
          title="Allowed email domains"
          class="pb-4 md:pb-6"
          subheading
        />
        <div
          v-if="result?.workspace.sso?.provider?.id"
          class="bg-foundation border border-outline-2 rounded-md p-4 text-body-xs mb-4"
        >
          With SSO enabled, allowed domains are configured on your identity provider's
          side.
        </div>
        <ul v-if="hasWorkspaceDomains">
          <li
            v-for="domain in workspaceDomains"
            :key="domain.id"
            class="border-x border-b first:border-t first:rounded-t-lg last:rounded-b-lg p-6 py-4 flex items-center"
          >
            <p class="text-body-xs font-medium flex-1">@{{ domain.domain }}</p>
            <FormButton
              :disabled="workspaceDomains.length === 1 && isDomainProtectionEnabled"
              color="outline"
              @click="openRemoveDialog(domain)"
            >
              Delete
            </FormButton>
          </li>
        </ul>

        <p
          v-else
          class="text-body-xs text-foreground-2 border border-outline-2 p-6 rounded-lg"
        >
          No verified domains yet
        </p>
      </section>
      <section class="mt-8">
        <div class="grid grid-cols-2 gap-x-6 items-center">
          <div class="flex flex-col gap-y-1">
            <p class="text-body-xs font-medium text-foreground">New domain</p>
            <p class="text-body-2xs text-foreground-2 leading-5">
              Add a domain from a list of email domains for your active account.
            </p>
          </div>
          <div class="flex gap-x-3">
            <FormSelectBase
              v-model="selectedDomain"
              :items="verifiedUserDomains"
              :disabled-item-predicate="disabledItemPredicate"
              disabled-item-tooltip="This domain can't be used for verified workspace domains"
              name="workspaceDomains"
              label="Verified domains"
              class="w-full"
            >
              <template #nothing-selected>Select domain</template>
              <template #something-selected="{ value }">@{{ value }}</template>
              <template #option="{ item }">
                <div class="flex items-center">@{{ item }}</div>
              </template>
            </FormSelectBase>
            <FormButton :disabled="!selectedDomain" @click="addDomain">Add</FormButton>
          </div>
        </div>
      </section>
      <section class="flex flex-col space-y-3 mt-8">
        <div class="flex flex-col space-y-8">
          <div class="flex items-center">
            <div class="flex-1 flex-col pr-6 gap-y-1">
              <p class="text-body-xs font-medium text-foreground">Domain protection</p>
              <p class="text-body-2xs text-foreground-2 leading-5 max-w-md">
                Admins won't be able to add users as members (or admins) to a workspace
                unless they are part of a workspace's email domain.
              </p>
            </div>
            <FormSwitch
              v-model="isDomainProtectionEnabled"
              :show-label="false"
              :disabled="!hasWorkspaceDomains"
              name="domain-protection"
            />
          </div>
          <div class="flex items-center">
            <div class="flex-1 flex-col pr-6 gap-y-1">
              <p class="text-body-xs font-medium text-foreground">
                Domain discoverability
              </p>
              <p class="text-body-2xs text-foreground-2 leading-5 max-w-md">
                Makes your workspace discoverable by employees who sign up with your
                company's specified email domain.
              </p>
            </div>
            <FormSwitch
              v-model="isDomainDiscoverabilityEnabled"
              name="domain-discoverability"
              :disabled="!hasWorkspaceDomains"
              :show-label="false"
            />
          </div>
        </div>
      </section>
    </div>

    <SettingsWorkspacesSecurityDomainRemoveDialog
      v-if="removeDialogDomain"
      v-model:open="showRemoveDomainDialog"
      :workspace-id="workspaceId"
      :domain="removeDialogDomain"
    />
  </section>
</template>

<script setup lang="ts">
import type { ShallowRef } from 'vue'
import { useApolloClient, useQuery } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type {
  Workspace,
  SettingsWorkspacesSecurityDomainRemoveDialog_WorkspaceDomainFragment
} from '~/lib/common/generated/gql/graphql'
import { SettingsUpdateWorkspaceSecurityDocument } from '~/lib/common/generated/gql/graphql'
import { getCacheId, getFirstErrorMessage } from '~/lib/common/helpers/graphql'
import { settingsWorkspacesSecurityQuery } from '~/lib/settings/graphql/queries'
import { useAddWorkspaceDomain } from '~/lib/settings/composables/management'
import { useMixpanel } from '~/lib/core/composables/mp'
import { blockedDomains } from '@speckle/shared'
import { useIsWorkspacesSsoEnabled } from '~/composables/globals'

graphql(`
  fragment SettingsWorkspacesSecurity_Workspace on Workspace {
    id
    slug
    domains {
      id
      domain
      ...SettingsWorkspacesSecurityDomainRemoveDialog_WorkspaceDomain
    }
    ...SettingsWorkspacesSecuritySsoWrapper_Workspace
    domainBasedMembershipProtectionEnabled
    discoverabilityEnabled
  }

  fragment SettingsWorkspacesSecurity_User on User {
    id
    emails {
      id
      email
      verified
    }
  }
`)

const props = defineProps<{
  workspaceId: string
}>()

const addWorkspaceDomain = useAddWorkspaceDomain()
const { triggerNotification } = useGlobalToast()
const isSsoEnabled = useIsWorkspacesSsoEnabled()
const apollo = useApolloClient().client
const mixpanel = useMixpanel()

const selectedDomain = ref<string>()
const showRemoveDomainDialog = ref(false)
const removeDialogDomain =
  ref<SettingsWorkspacesSecurityDomainRemoveDialog_WorkspaceDomainFragment>()
const blockedDomainItems: ShallowRef<string[]> = shallowRef(blockedDomains)

const { result } = useQuery(settingsWorkspacesSecurityQuery, {
  workspaceId: props.workspaceId
})

const workspaceDomains = computed(() => {
  return result.value?.workspace.domains || []
})
const hasWorkspaceDomains = computed(() => workspaceDomains.value.length > 0)

const verifiedUserDomains = computed(() => {
  const workspaceDomainSet = new Set(workspaceDomains.value.map((item) => item.domain))

  return [
    ...new Set(
      (result.value?.activeUser?.emails ?? [])
        .filter((email) => email.verified)
        .map((email) => email.email.split('@')[1])
        .filter((domain) => !workspaceDomainSet.has(domain))
    )
  ]
})

const isDomainProtectionEnabled = computed({
  get: () => result.value?.workspace.domainBasedMembershipProtectionEnabled || false,
  set: async (newVal) => {
    const mutationResult = await apollo
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
              id: props.workspaceId,
              domainBasedMembershipProtectionEnabled: newVal,
              discoverabilityEnabled:
                result.value?.workspace.discoverabilityEnabled || false
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
                res.data?.workspaceMutations.update
                  .domainBasedMembershipProtectionEnabled || false
            }
          })
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (mutationResult?.data) {
      mixpanel.track('Workspace Domain Protection Toggled', {
        value: newVal,
        // eslint-disable-next-line camelcase
        workspace_id: props.workspaceId
      })
    } else {
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to update',
        description: getFirstErrorMessage(mutationResult?.errors)
      })
    }
  }
})

const isDomainDiscoverabilityEnabled = computed({
  get: () => result.value?.workspace.discoverabilityEnabled || false,
  set: async (newVal) => {
    const mutationResult = await apollo.mutate({
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
            id: props.workspaceId,
            domainBasedMembershipProtectionEnabled:
              result.value?.workspace.domainBasedMembershipProtectionEnabled || false,
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
            discoverabilityEnabled: () =>
              res.data?.workspaceMutations.update.discoverabilityEnabled || false
          }
        })
      }
    })

    if (mutationResult?.data) {
      mixpanel.track('Workspace Discoverability Toggled', {
        value: newVal,
        // eslint-disable-next-line camelcase
        workspace_id: props.workspaceId
      })
    } else {
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to update',
        description: getFirstErrorMessage(mutationResult?.errors)
      })
    }
  }
})

const addDomain = async () => {
  if (!selectedDomain.value || !result.value?.workspace) return
  await addWorkspaceDomain.mutate(
    {
      domain: selectedDomain.value,
      workspaceId: props.workspaceId
    },
    result.value?.workspace.domains ?? [],
    result.value?.workspace.discoverabilityEnabled,
    result.value?.workspace.domainBasedMembershipProtectionEnabled
  )

  mixpanel.track('Workspace Domain Added', {
    // eslint-disable-next-line camelcase
    workspace_id: props.workspaceId
  })
  selectedDomain.value = undefined
}

const openRemoveDialog = (
  domain: SettingsWorkspacesSecurityDomainRemoveDialog_WorkspaceDomainFragment
) => {
  removeDialogDomain.value = domain
  showRemoveDomainDialog.value = true
}

const disabledItemPredicate = (item: string) => {
  return blockedDomainItems.value.includes(item)
}

watch(
  () => workspaceDomains.value,
  () => {
    if (!hasWorkspaceDomains.value) {
      isDomainDiscoverabilityEnabled.value = false
    }
  }
)
</script>
