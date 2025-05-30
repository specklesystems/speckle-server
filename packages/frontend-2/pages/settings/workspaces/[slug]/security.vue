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

        <SettingsWorkspacesSecurityDomainProtection
          v-if="workspace"
          :workspace="workspace"
        />
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
    ...SettingsWorkspacesSecurityDiscoverability_Workspace
    ...SettingsWorkspacesSecuritySsoWrapper_Workspace
    ...SettingsWorkspacesSecurityDomainProtection_Workspace
    id
    slug
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

const { result } = useQuery(settingsWorkspacesSecurityQuery, {
  slug: slug.value
})

const workspace = computed(() => result.value?.workspaceBySlug)
</script>
