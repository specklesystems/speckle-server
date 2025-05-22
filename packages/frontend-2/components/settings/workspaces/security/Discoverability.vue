<template>
  <section>
    <SettingsSectionHeader title="Workspace discoverability" subheading />
    <p class="text-body-xs text-foreground-2 mt-2 mb-6">
      Let users discover the workspace if they sign up with a matching email.
    </p>
    <CommonCard v-if="workspace?.sso?.provider?.id" class="bg-foundation mb-4">
      With SSO enabled, allowed domains are configured on your identity provider's side.
    </CommonCard>

    <DomainManagement
      :domains="workspaceDomains"
      :available-domains="verifiedUserDomains"
      add-domain-title="New domain"
      add-domain-description="Add a domain from a list of email domains for your active account."
      select-name="discoverabilityDomains"
      @add="handleAddDomain"
      @remove="openRemoveDialog"
    />

    <div class="mt-6 flex flex-col gap-2">
      <p class="text-body-xs font-medium text-foreground">New user policy</p>
      <FormRadio
        v-for="option in radioOptions"
        :key="option.value"
        :label="option.title"
        :description="option.description"
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
import { useAddWorkspaceDomain } from '~/lib/settings/composables/management'
import { useMixpanel } from '~/lib/core/composables/mp'
import { workspaceUpdateDiscoverabilityMutation } from '~/lib/workspaces/graphql/mutations'
import { useVerifiedUserEmailDomains } from '~/lib/workspaces/composables/security'
import DomainManagement from './DomainManagement.vue'

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

const { domains: userEmailDomains } = useVerifiedUserEmailDomains({
  filterBlocked: false
})
const addWorkspaceDomain = useAddWorkspaceDomain()
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
const verifiedUserDomains = computed(() => {
  const workspaceDomainSet = new Set(workspaceDomains.value.map((item) => item.domain))

  return [
    ...new Set(
      userEmailDomains.value.filter((domain) => !workspaceDomainSet.has(domain))
    )
  ]
})

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

const handleAddDomain = async (domain: string) => {
  if (!props.workspace) return
  const isFirstDomain = !hasWorkspaceDomains.value

  await addWorkspaceDomain.mutate(
    {
      domain,
      workspaceId: props.workspace.id
    },
    props.workspace.domains ?? [],
    isFirstDomain,
    props.workspace.domainBasedMembershipProtectionEnabled,
    props.workspace.hasAccessToSSO,
    props.workspace.hasAccessToDomainBasedSecurityPolicies
  )

  mixpanel.track('Workspace Domain Added', {
    // eslint-disable-next-line camelcase
    workspace_id: props.workspace?.id
  })
}

const openRemoveDialog = (
  domain: SettingsWorkspacesSecurityDomainRemoveDialog_WorkspaceDomainFragment
) => {
  removeDialogDomain.value = domain
  showRemoveDomainDialog.value = true
}

const radioOptions = [
  {
    title: 'Admin approval required',
    description: 'Users must be approved by an admin to join the workspace.',
    value: JoinPolicy.AdminApproval
  },
  {
    title: 'Auto-join',
    description:
      'Users with a verified email address can join the workspace without admin approval.',
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
