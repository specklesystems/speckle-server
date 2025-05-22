<template>
  <section>
    <div class="md:max-w-xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader
        title="Security"
        text="Manage verified workspace domains and associated features."
      />
      <div class="flex flex-col divide-y divide-outline-2">
        <section>
          <SettingsSectionHeader title="Workspace discoverability" subheading />
          <p class="text-body-xs text-foreground-2 mt-2 mb-6">
            Let users discover the workspace if they sign up with a matching email.
          </p>
          <CommonCard v-if="workspace?.sso?.provider?.id" class="bg-foundation mb-4">
            With SSO enabled, allowed domains are configured on your identity provider's
            side.
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
              <FormButton :disabled="!selectedDomain" @click="addDomain">
                Add
              </FormButton>
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
        </section>

        <template v-if="isSsoEnabled">
          <SettingsWorkspacesSecuritySsoWrapper
            v-if="workspace"
            :workspace="workspace"
          />
        </template>

        <section class="py-8">
          <SettingsSectionHeader subheading title="Allowed email domains" />
          <p class="text-body-xs text-foreground-2 mt-2 mb-6">
            Only users with email addresses from your verified domains can be added as
            workspace members or administrators.
          </p>
          <div class="flex">
            <div class="flex-1 flex-col pr-6 gap-y-1">
              <p class="text-body-xs font-medium text-foreground">Domain protection</p>
              <p class="text-body-2xs text-foreground-2 leading-5 max-w-md">
                Only users with email addresses from your verified domains can be added
                as workspace members or administrators.
              </p>
            </div>
            <div key="tooltipText" v-tippy="switchDisabled ? tooltipText : undefined">
              <!-- Never disable switch when domain protection is enabled to
               allow expired workspaces ability to downgrade-->
              <FormSwitch
                v-model="isDomainProtectionEnabled"
                :show-label="false"
                :disabled="switchDisabled"
                name="domain-protection"
              />
            </div>
          </div>
        </section>
      </div>
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
import { useQuery, useMutation } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type { SettingsWorkspacesSecurityDomainRemoveDialog_WorkspaceDomainFragment } from '~/lib/common/generated/gql/graphql'
import { settingsWorkspacesSecurityQuery } from '~/lib/settings/graphql/queries'
import { useAddWorkspaceDomain } from '~/lib/settings/composables/management'
import { useMixpanel } from '~/lib/core/composables/mp'
import { blockedDomains } from '@speckle/shared'
import { useIsWorkspacesSsoEnabled } from '~/composables/globals'
import {
  workspaceUpdateDomainProtectionMutation,
  workspaceUpdateDiscoverabilityMutation
} from '~/lib/workspaces/graphql/mutations'
import { useVerifiedUserEmailDomains } from '~/lib/workspaces/composables/security'
import { FormRadio } from '@speckle/ui-components'

graphql(`
  fragment SettingsWorkspacesSecurity_Workspace on Workspace {
    id
    slug
    plan {
      name
      status
    }
    domains {
      id
      domain
      ...SettingsWorkspacesSecurityDomainRemoveDialog_WorkspaceDomain
    }
    ...SettingsWorkspacesSecuritySsoWrapper_Workspace
    domainBasedMembershipProtectionEnabled
    discoverabilityEnabled
    hasAccessToDomainBasedSecurityPolicies: hasAccessToFeature(
      featureName: domainBasedSecurityPolicies
    )
  }
`)

definePageMeta({
  layout: 'settings'
})

useHead({
  title: 'Settings | Workspace - Security'
})

enum JoinPolicy {
  AdminApproval = 'admin-approval',
  AutoJoin = 'auto-join'
}

const slug = computed(() => (route.params.slug as string) || '')

const { domains: userEmailDomains } = useVerifiedUserEmailDomains({
  filterBlocked: false
})
const route = useRoute()
const addWorkspaceDomain = useAddWorkspaceDomain()
const isSsoEnabled = useIsWorkspacesSsoEnabled()
const mixpanel = useMixpanel()
const { mutate: updateDomainProtection } = useMutation(
  workspaceUpdateDomainProtectionMutation
)
const { mutate: updateDiscoverability } = useMutation(
  workspaceUpdateDiscoverabilityMutation
)

const selectedDomain = ref<string>()
const showRemoveDomainDialog = ref(false)
const removeDialogDomain =
  ref<SettingsWorkspacesSecurityDomainRemoveDialog_WorkspaceDomainFragment>()
const blockedDomainItems: ShallowRef<string[]> = shallowRef(blockedDomains)
const joinPolicy = ref<JoinPolicy>(JoinPolicy.AdminApproval)

const { result } = useQuery(settingsWorkspacesSecurityQuery, {
  slug: slug.value
})

const workspace = computed(() => result.value?.workspaceBySlug)
const workspaceDomains = computed(() => {
  return workspace.value?.domains || []
})
const hasAccessToDomainBasedSecurityPolicies = computed(
  () => workspace.value?.hasAccessToDomainBasedSecurityPolicies
)

const hasWorkspaceDomains = computed(() => workspaceDomains.value.length > 0)
const verifiedUserDomains = computed(() => {
  const workspaceDomainSet = new Set(workspaceDomains.value.map((item) => item.domain))

  return [
    ...new Set(
      userEmailDomains.value.filter((domain) => !workspaceDomainSet.has(domain))
    )
  ]
})

const isDomainProtectionEnabled = computed({
  get: () => workspace.value?.domainBasedMembershipProtectionEnabled || false,
  set: async (newVal) => {
    if (!workspace.value?.id) return

    const result = await updateDomainProtection({
      input: {
        id: workspace.value.id,
        domainBasedMembershipProtectionEnabled: newVal
      }
    }).catch(convertThrowIntoFetchResult)

    if (result?.data) {
      mixpanel.track('Workspace Domain Protection Toggled', {
        value: newVal,
        // eslint-disable-next-line camelcase
        workspace_id: workspace.value?.id
      })
    }
  }
})

const isDomainDiscoverabilityEnabled = computed({
  get: () => workspace.value?.discoverabilityEnabled || false,
  set: async (newVal) => {
    if (!workspace.value?.id) return

    const result = await updateDiscoverability({
      input: {
        id: workspace.value.id,
        discoverabilityEnabled: newVal
      }
    }).catch(convertThrowIntoFetchResult)

    if (result?.data) {
      mixpanel.track('Workspace Discoverability Toggled', {
        value: newVal,
        // eslint-disable-next-line camelcase
        workspace_id: workspace.value?.id
      })
    }
  }
})

const switchDisabled = computed(() => {
  if (isDomainProtectionEnabled.value) return false
  if (!hasAccessToDomainBasedSecurityPolicies.value) return true
  if (!hasWorkspaceDomains.value) return true
  return false
})

const tooltipText = computed(() => {
  if (isDomainProtectionEnabled.value) return undefined
  if (!hasAccessToDomainBasedSecurityPolicies.value) return 'Business plan required'
  if (!hasWorkspaceDomains.value)
    return 'Your workspace must have at least one verified domain'
  return undefined
})

const addDomain = async () => {
  if (!selectedDomain.value || !workspace.value) return
  const isFirstDomain = !hasWorkspaceDomains.value

  await addWorkspaceDomain.mutate(
    {
      domain: selectedDomain.value,
      workspaceId: workspace.value.id
    },
    workspace.value.domains ?? [],
    isFirstDomain,
    workspace.value.domainBasedMembershipProtectionEnabled,
    workspace.value.hasAccessToSSO,
    workspace.value.hasAccessToDomainBasedSecurityPolicies
  )

  mixpanel.track('Workspace Domain Added', {
    // eslint-disable-next-line camelcase
    workspace_id: workspace.value?.id
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
