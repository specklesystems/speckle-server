<template>
  <section>
    <div class="md:max-w-xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader
        title="Security"
        text="Manage verified workspace domains and associated features."
      />
      <div v-if="workspace" class="flex flex-col divide-y divide-outline-2 pb-12">
        <SettingsWorkspacesSecurityDefaultSeat :workspace="workspace" />
        <SettingsWorkspacesSecurityDomainManagement :workspace="workspace" />
        <SettingsWorkspacesSecurityDiscoverability :workspace="workspace" />
        <SettingsWorkspacesSecurityDomainProtection :workspace="workspace" />
        <template v-if="isSsoEnabled">
          <SettingsWorkspacesSecuritySsoWrapper :workspace="workspace" />
        </template>
        <SettingsWorkspacesSecurityWorkspaceCreation :workspace="workspace" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import { settingsWorkspacesSecurityQuery } from '~/lib/settings/graphql/queries'
import { useIsWorkspacesSsoEnabled } from '~/composables/globals'

graphql(`
  fragment SettingsWorkspacesSecurity_Workspace on Workspace {
    ...SettingsWorkspacesSecurityDefaultSeat_Workspace
    ...SettingsWorkspacesSecurityDomainManagement_Workspace
    ...SettingsWorkspacesSecurityDiscoverability_Workspace
    ...SettingsWorkspacesSecuritySsoWrapper_Workspace
    ...SettingsWorkspacesSecurityDomainProtection_Workspace
    ...SettingsWorkspacesSecurityWorkspaceCreation_Workspace
    id
    slug
  }
`)

definePageMeta({
  middleware: ['require-valid-workspace'],
  layout: 'settings'
})

useHead({
  title: 'Settings | Workspace - Security'
})

const slug = computed(() => (route.params.slug as string) || '')
const route = useRoute()
const isSsoEnabled = useIsWorkspacesSsoEnabled()

const { result } = useQuery(settingsWorkspacesSecurityQuery, {
  slug: slug.value
})

const workspace = computed(() => result.value?.workspaceBySlug)
</script>
