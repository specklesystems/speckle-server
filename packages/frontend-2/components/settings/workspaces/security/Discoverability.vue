<template>
  <section>
    <SettingsSectionHeader title="Workspace discoverability" subheading />
    <p class="text-body-xs text-foreground-2 mt-2 mb-6">
      Let users discover the workspace if they sign up with a matching email.
    </p>
    <CommonCard v-if="workspace?.sso?.provider?.id" class="bg-foundation mb-4">
      With SSO enabled, allowed domains are configured on your identity provider's side.
    </CommonCard>
    <ul v-if="hasWorkspaceDomains">
      <li
        v-for="domain in workspaceDomains"
        :key="domain.id"
        class="border-x border-b first:border-t first:rounded-t-lg border-outline-2 last:rounded-b-lg p-6 py-4 flex items-center"
      >
        <p class="text-body-xs font-medium flex-1">@{{ domain.domain }}</p>
        <FormButton color="outline" size="sm" @click="openRemoveDialog(domain)">
          Delete
        </FormButton>
      </li>
    </ul>

    <p
      v-else
      class="text-body-xs text-center text-foreground-2 border border-outline-2 p-6 rounded-lg"
    >
      No verified domains yet
    </p>

    <div class="grid grid-cols-2 gap-x-6 mt-6">
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
import type { ShallowRef } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type {
  SettingsWorkspacesSecurityDiscoverability_WorkspaceFragment,
  SettingsWorkspacesSecurityDomainRemoveDialog_WorkspaceDomainFragment
} from '~/lib/common/generated/gql/graphql'
import { useAddWorkspaceDomain } from '~/lib/settings/composables/management'
import { useMixpanel } from '~/lib/core/composables/mp'
import { blockedDomains } from '@speckle/shared'
import { workspaceUpdateDiscoverabilityMutation } from '~/lib/workspaces/graphql/mutations'
import { useVerifiedUserEmailDomains } from '~/lib/workspaces/composables/security'

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

const selectedDomain = ref<string>()
const showRemoveDomainDialog = ref(false)
const removeDialogDomain =
  ref<SettingsWorkspacesSecurityDomainRemoveDialog_WorkspaceDomainFragment>()
const blockedDomainItems: ShallowRef<string[]> = shallowRef(blockedDomains)
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

const addDomain = async () => {
  if (!selectedDomain.value || !props.workspace) return
  const isFirstDomain = !hasWorkspaceDomains.value

  await addWorkspaceDomain.mutate(
    {
      domain: selectedDomain.value,
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
