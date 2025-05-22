<template>
  <section>
    <div class="md:max-w-xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader
        title="Security"
        text="Manage verified workspace domains and associated features."
      />
      <div class="flex flex-col divide-y divide-outline-2">
        <SettingsWorkspacesSecurityDiscoverability
          v-if="workspace"
          :workspace="workspace"
        />

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
  </section>
</template>

<script setup lang="ts">
import { useQuery, useMutation } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import { settingsWorkspacesSecurityQuery } from '~/lib/settings/graphql/queries'
import { useMixpanel } from '~/lib/core/composables/mp'
import { useIsWorkspacesSsoEnabled } from '~/composables/globals'
import { workspaceUpdateDomainProtectionMutation } from '~/lib/workspaces/graphql/mutations'

graphql(`
  fragment SettingsWorkspacesSecurity_Workspace on Workspace {
    ...SettingsWorkspacesSecurityDiscoverability_Workspace
    ...SettingsWorkspacesSecuritySsoWrapper_Workspace
    id
    slug
    plan {
      name
      status
    }
    domainBasedMembershipProtectionEnabled
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

const route = useRoute()
const isSsoEnabled = useIsWorkspacesSsoEnabled()
const mixpanel = useMixpanel()
const { mutate: updateDomainProtection } = useMutation(
  workspaceUpdateDomainProtectionMutation
)

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
</script>
