<template>
  <section>
    <div class="md:max-w-5xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader
        title="Automation"
        text="Manage workspace functions and project automations"
      />
      <SettingsWorkspacesAutomationFunctions
        :workspace-functions="workspaceFunctions"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import { settingsWorkspacesAutomationQuery } from '~/lib/settings/graphql/queries'

graphql(`
  fragment SettingsWorkspacesAutomation_Workspace on Workspace {
    ...SettingsWorkspacesAutomationFunctions_Workspace
    id
    slug
  }
`)

definePageMeta({
  layout: 'settings'
})

useHead({
  title: 'Settings | Workspace - Automation'
})

const route = useRoute()
const slug = computed(() => (route.params.slug as string) || '')

const { result } = useQuery(settingsWorkspacesAutomationQuery, {
  slug: slug.value
})

const workspaceFunctions = computed(
  () => result?.value?.workspaceBySlug.automateFunctions.items ?? []
)
</script>
