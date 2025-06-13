<template>
  <section class="py-8">
    <SettingsSectionHeader subheading title="Domain protection" />
    <p class="text-body-xs text-foreground-2 mt-2 mb-6">
      Secure access to the workspace with your verified domains.
    </p>

    <div class="flex items-center">
      <div class="flex-1 flex-col pr-6 gap-y-1">
        <p class="text-body-xs font-medium text-foreground">Enable domain protection</p>
        <p class="text-body-2xs text-foreground-2 leading-5 max-w-md mt-1">
          Only allow users with verified domains to join the workspace.
        </p>
      </div>
      <div
        v-if="props.workspace?.hasAccessToDomainBasedSecurityPolicies"
        key="tooltipText"
        v-tippy="switchDisabled ? tooltipText : undefined"
      >
        <!-- Never disable switch when domain protection is enabled to
         allow expired workspaces ability to downgrade-->
        <FormSwitch
          v-model="isDomainProtectionEnabled"
          :show-label="false"
          :disabled="switchDisabled"
          name="domain-protection"
        />
      </div>
      <FormButton
        v-else
        :to="settingsWorkspaceRoutes.billing.route(workspace.slug)"
        size="sm"
        color="outline"
      >
        Upgrade to Business
      </FormButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Roles } from '@speckle/shared'
import { useMutation } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type { SettingsWorkspacesSecurityDomainProtection_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~/lib/core/composables/mp'
import { workspaceUpdateDomainProtectionMutation } from '~/lib/workspaces/graphql/mutations'
import { settingsWorkspaceRoutes } from '~/lib/common/helpers/route'

graphql(`
  fragment SettingsWorkspacesSecurityDomainProtection_Workspace on Workspace {
    id
    slug
    role
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
const { triggerNotification } = useGlobalToast()

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
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Domain protection updated',
        description: `Domain protection has been ${newVal ? 'enabled' : 'disabled'}`
      })
      mixpanel.track('Workspace Domain Protection Toggled', {
        value: newVal,
        // eslint-disable-next-line camelcase
        workspace_id: props.workspace?.id
      })
    } else {
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to update domain protection',
        description: 'Please try again later'
      })
    }
  }
})

const switchDisabled = computed(() => {
  if (props.workspace?.role !== Roles.Workspace.Admin) return true
  if (isDomainProtectionEnabled.value) return false
  if (!hasWorkspaceDomains.value) return true
  return false
})

const tooltipText = computed(() => {
  if (props.workspace?.role !== Roles.Workspace.Admin)
    return 'You must be a workspace admin'
  if (isDomainProtectionEnabled.value) return undefined
  if (!hasWorkspaceDomains.value)
    return 'Your workspace must have at least one verified domain'
  return undefined
})
</script>
