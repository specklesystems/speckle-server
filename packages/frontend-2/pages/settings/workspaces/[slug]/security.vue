<template>
  <section>
    <div class="md:max-w-xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader
        title="Security"
        text="Manage verified workspace domains and associated features."
      />
      <template v-if="isSsoEnabled">
        <SettingsWorkspacesSecuritySsoWrapper v-if="workspace" :workspace="workspace" />
        <hr class="my-6 md:my-8 border-outline-2" />
      </template>
      <section>
        <SettingsSectionHeader
          title="Allowed email domains"
          class="pb-4 md:pb-6"
          subheading
        />
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
              <div class="flex items-center">
                <p class="text-body-xs font-medium text-foreground">
                  Domain protection
                </p>
              </div>
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
          <div class="flex items-center">
            <div class="flex-1 flex-col pr-6 gap-y-1">
              <p class="text-body-xs font-medium text-foreground">
                Domain-based discoverability
              </p>
              <p class="text-body-2xs text-foreground-2 leading-5 max-w-md">
                When enabled, users with a verified email address from your verified
                domain list will be able to request to join this workspace.
              </p>
            </div>
            <FormSwitch
              v-model="isDomainDiscoverabilityEnabled"
              name="domain-discoverability"
              :disabled="!hasWorkspaceDomains"
              :show-label="false"
            />
          </div>
          <div class="flex flex-col gap-y-1 pb-8">
            <div class="flex items-center">
              <div class="flex-1 flex-col pr-6 gap-y-1">
                <p class="text-body-xs font-medium text-foreground">
                  Allow verified domain users to auto-join
                </p>
                <p class="text-body-2xs text-foreground-2 leading-5 max-w-md">
                  When enabled, users with an email address from your verified domain
                  list will be able to join without admin approval.
                </p>
              </div>
              <FormSwitch
                v-tippy="
                  !isDomainDiscoverabilityEnabled
                    ? 'Domain-based discoverability must be enabled'
                    : undefined
                "
                :model-value="getCheckedValue === JoinPolicy.AutoJoin"
                name="auto-join"
                :disabled="!hasWorkspaceDomains || !isDomainDiscoverabilityEnabled"
                :show-label="false"
                @update:model-value="
                  (val) =>
                    handleJoinPolicyChange(
                      val ? JoinPolicy.AutoJoin : JoinPolicy.AdminApproval
                    )
                "
              />
            </div>
          </div>
        </div>
      </section>
    </div>

    <SettingsWorkspacesSecurityDomainRemoveDialog
      v-if="removeDialogDomain"
      v-model:open="showRemoveDomainDialog"
      :workspace-id="workspace?.id"
      :domain="removeDialogDomain"
    />
    <SettingsWorkspacesSecurityConfirmJoinPolicyDialog
      v-if="showConfirmJoinPolicyDialog"
      v-model:open="showConfirmJoinPolicyDialog"
      @confirm="handleJoinPolicyConfirm"
      @cancel="pendingJoinPolicy = undefined"
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
  workspaceUpdateDiscoverabilityMutation,
  workspaceUpdateAutoJoinMutation
} from '~/lib/workspaces/graphql/mutations'
import { useVerifiedUserEmailDomains } from '~/lib/workspaces/composables/security'

enum JoinPolicy {
  AdminApproval = 'admin-approval',
  AutoJoin = 'auto-join'
}

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
    discoverabilityAutoJoinEnabled
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
const { mutate: updateAutoJoin } = useMutation(workspaceUpdateAutoJoinMutation)
const { triggerNotification } = useGlobalToast()

const selectedDomain = ref<string>()
const showRemoveDomainDialog = ref(false)
const removeDialogDomain =
  ref<SettingsWorkspacesSecurityDomainRemoveDialog_WorkspaceDomainFragment>()
const blockedDomainItems: ShallowRef<string[]> = shallowRef(blockedDomains)
const showConfirmJoinPolicyDialog = ref(false)
const pendingJoinPolicy = ref<JoinPolicy>()

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

      // If turning off discoverability, also turn off auto-join
      if (!newVal && workspace.value.discoverabilityAutoJoinEnabled) {
        const autoJoinResult = await updateAutoJoin({
          input: {
            id: workspace.value.id,
            discoverabilityAutoJoinEnabled: false
          }
        }).catch(convertThrowIntoFetchResult)

        if (autoJoinResult?.data) {
          mixpanel.track('Workspace Join Policy Updated', {
            value: 'admin-approval',
            // eslint-disable-next-line camelcase
            workspace_id: workspace.value.id
          })
        }
      }
    }
  }
})

const getCheckedValue = computed(() => {
  if (isDomainDiscoverabilityEnabled.value) {
    return workspace.value?.discoverabilityAutoJoinEnabled
      ? JoinPolicy.AutoJoin
      : JoinPolicy.AdminApproval
  }
  return null
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
  await addWorkspaceDomain.mutate(
    {
      domain: selectedDomain.value,
      workspaceId: workspace.value.id
    },
    workspace.value.domains ?? [],
    workspace.value.discoverabilityEnabled,
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

const handleJoinPolicyChange = async (newValue: JoinPolicy) => {
  if (newValue === JoinPolicy.AutoJoin) {
    showConfirmJoinPolicyDialog.value = true
    pendingJoinPolicy.value = newValue
  } else {
    if (!workspace.value?.id) return

    const result = await updateAutoJoin({
      input: {
        id: workspace.value.id,
        discoverabilityAutoJoinEnabled: false
      }
    }).catch(convertThrowIntoFetchResult)

    if (result?.data) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'New user policy updated',
        description: 'Admin approval is now required for new users to join'
      })
      mixpanel.track('Workspace Join Policy Updated', {
        value: 'admin-approval',
        // eslint-disable-next-line camelcase
        workspace_id: workspace.value.id
      })
    }
  }
}

const handleJoinPolicyConfirm = async () => {
  if (!workspace.value?.id || !pendingJoinPolicy.value) return

  const result = await updateAutoJoin({
    input: {
      id: workspace.value.id,
      discoverabilityAutoJoinEnabled: true
    }
  }).catch(convertThrowIntoFetchResult)

  if (result?.data) {
    showConfirmJoinPolicyDialog.value = false
    pendingJoinPolicy.value = undefined

    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'New user policy updated',
      description: 'Users with a verified domain can now join without admin approval'
    })
    mixpanel.track('Workspace Join Policy Updated', {
      value: 'auto-join',
      // eslint-disable-next-line camelcase
      workspace_id: workspace.value.id
    })
  }
}
</script>
