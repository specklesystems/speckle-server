<template>
  <section class="py-8">
    <SettingsSectionHeader subheading title="Domain protection" />
    <p class="text-body-xs text-foreground-2 mt-2 mb-6">
      When enabled, only users with email addresses from specific domains can be added
      as members.
    </p>

    <div class="flex">
      <div class="flex-1 flex-col pr-6 gap-y-1">
        <p class="text-body-xs font-medium text-foreground">Domain protection</p>
        <p class="text-body-2xs text-foreground-2 leading-5 max-w-md">
          Only allow users with verified domains to join the workspace
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
</template>

<script setup lang="ts">
import { useMutation } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type { SettingsWorkspacesSecurityDomainProtection_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~/lib/core/composables/mp'
import { workspaceUpdateDomainProtectionMutation } from '~/lib/workspaces/graphql/mutations'

graphql(`
  fragment SettingsWorkspacesSecurityDomainProtection_Workspace on Workspace {
    id
    domainBasedMembershipProtectionEnabled
    hasAccessToDomainBasedSecurityPolicies: hasAccessToFeature(
      featureName: domainBasedSecurityPolicies
    )
    domains {
      id
    }
  }
`)

const props = defineProps<{
  workspace: SettingsWorkspacesSecurityDomainProtection_WorkspaceFragment
}>()

const mixpanel = useMixpanel()
const { mutate: updateDomainProtection } = useMutation(
  workspaceUpdateDomainProtectionMutation
)

const hasWorkspaceDomains = computed(() => (props.workspace?.domains?.length || 0) > 0)

const isDomainProtectionEnabled = computed({
  get: () => props.workspace?.domainBasedMembershipProtectionEnabled || false,
  set: async (newVal) => {
    if (!props.workspace?.id) return

    const result = await updateDomainProtection({
      input: {
        id: props.workspace.id,
        domainBasedMembershipProtectionEnabled: newVal
      }
    }).catch(convertThrowIntoFetchResult)

    if (result?.data) {
      mixpanel.track('Workspace Domain Protection Toggled', {
        value: newVal,
        // eslint-disable-next-line camelcase
        workspace_id: props.workspace?.id
      })
    }
  }
})

const switchDisabled = computed(() => {
  if (isDomainProtectionEnabled.value) return false
  if (!props.workspace?.hasAccessToDomainBasedSecurityPolicies) return true
  if (!hasWorkspaceDomains.value) return true
  return false
})

const tooltipText = computed(() => {
  if (isDomainProtectionEnabled.value) return undefined
  if (!props.workspace?.hasAccessToDomainBasedSecurityPolicies)
    return 'Business plan required'
  if (!hasWorkspaceDomains.value)
    return 'Your workspace must have at least one verified domain'
  return undefined
})
</script>
