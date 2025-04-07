<template>
  <section>
    <div class="md:max-w-xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader
        title="Automation"
        text="Configure your workspace automations and functions"
      />
      <SettingsSectionHeader title="Automation templates" subheading />
      <hr class="my-6 border-outline-2" />
      <SettingsSectionHeader title="Functions" subheading />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { settingsWorkspaceAutomationQuery } from '~/lib/settings/graphql/queries'
import { graphql } from '~~/lib/common/generated/gql'

graphql(`
  fragment SettingsWorkspacesAutomation_Workspace on Workspace {
    id
    ...SettingsWorkspacesAutomationAutomationTemplatesTable_Workspace
    ...SettingsWorkspacesAutomationFunctionsTable_Workspace
  }
`)

definePageMeta({
  layout: 'settings'
})

useHead({
  title: 'Settings | Workspace - Automation'
})

const routeSlug = computed(() => (route.params.slug as string) || '')

const route = useRoute()

const { result: workspaceResult } = useQuery(settingsWorkspaceAutomationQuery, () => ({
  slug: routeSlug.value
}))
</script>
