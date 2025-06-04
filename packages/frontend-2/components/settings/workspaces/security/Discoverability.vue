<template>
  <section class="pt-8">
    <SettingsSectionHeader title="Workspace discoverability" subheading />
    <p class="text-body-xs text-foreground-2 mt-2 mb-6">
      Let users discover the workspace if they sign up with a matching email.
    </p>
    <CommonCard v-if="workspace?.sso?.provider?.id" class="bg-foundation mb-4">
      With SSO enabled, allowed domains are configured on your identity provider's side.
    </CommonCard>

    <div class="mt-6 flex flex-col gap-2">
      <p class="text-body-xs font-medium text-foreground">How do people join?</p>
      <FormRadio
        v-for="option in radioOptions"
        :key="option.value"
        :label="option.title"
        :value="option.value"
        name="measurementType"
        :checked="joinPolicy === option.value"
        size="sm"
        @change="joinPolicy = option.value"
      />
    </div>

    <SettingsWorkspacesSecurityDomainRemoveDialog
      v-if="removeDialogDomain"
      v-model:open="showRemoveDomainDialog"
      :workspace-id="workspace?.id"
      :domain="removeDialogDomain"
    />
  </section>
</template>

<script setup lang="ts">
import { useMutation } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type {
  SettingsWorkspacesSecurityDiscoverability_WorkspaceFragment,
  SettingsWorkspacesSecurityDomainRemoveDialog_WorkspaceDomainFragment
} from '~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~/lib/core/composables/mp'
import { workspaceUpdateDiscoverabilityMutation } from '~/lib/workspaces/graphql/mutations'

graphql(`
  fragment SettingsWorkspacesSecurityDiscoverability_Workspace on Workspace {
    id
    slug
    domains {
      id
      domain
      ...SettingsWorkspacesSecurityDomainRemoveDialog_WorkspaceDomain
    }
    sso {
      provider {
        id
      }
    }
    discoverabilityEnabled
    domainBasedMembershipProtectionEnabled
    hasAccessToDomainBasedSecurityPolicies: hasAccessToFeature(
      featureName: domainBasedSecurityPolicies
    )
    hasAccessToSSO: hasAccessToFeature(featureName: oidcSso)
  }
`)

const props = defineProps<{
  workspace: SettingsWorkspacesSecurityDiscoverability_WorkspaceFragment
}>()

enum JoinPolicy {
  AdminApproval = 'admin-approval',
  AutoJoin = 'auto-join'
}

const mixpanel = useMixpanel()
const { mutate: updateDiscoverability } = useMutation(
  workspaceUpdateDiscoverabilityMutation
)

const showRemoveDomainDialog = ref(false)
const removeDialogDomain =
  ref<SettingsWorkspacesSecurityDomainRemoveDialog_WorkspaceDomainFragment>()
const joinPolicy = ref<JoinPolicy>(JoinPolicy.AdminApproval)

const workspaceDomains = computed(() => {
  return props.workspace?.domains || []
})

const hasWorkspaceDomains = computed(() => workspaceDomains.value.length > 0)

const isDomainDiscoverabilityEnabled = computed({
  get: () => props.workspace?.discoverabilityEnabled || false,
  set: async (newVal) => {
    if (!props.workspace?.id) return

    const result = await updateDiscoverability({
      input: {
        id: props.workspace.id,
        discoverabilityEnabled: newVal
      }
    }).catch(convertThrowIntoFetchResult)

    if (result?.data) {
      mixpanel.track('Workspace Discoverability Toggled', {
        value: newVal,
        // eslint-disable-next-line camelcase
        workspace_id: props.workspace?.id
      })
    }
  }
})

const radioOptions = [
  {
    title: 'Admin has to accept the request',
    value: JoinPolicy.AdminApproval
  },
  {
    title: 'Allow people to auto-join',
    value: JoinPolicy.AutoJoin
  }
] as const

watch(
  () => workspaceDomains.value,
  () => {
    if (!hasWorkspaceDomains.value) {
      isDomainDiscoverabilityEnabled.value = false
    }
  }
)
</script>
