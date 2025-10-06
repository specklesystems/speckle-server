<template>
  <section>
    <SettingsSectionHeader
      title="Integrations"
      text="Connect your workspace to authorized applications."
    />
    <IntegrationsAccCard
      :workspace-id="workspaceResult?.workspaceBySlug.id || ''"
      :workspace-slug="routeSlug"
    ></IntegrationsAccCard>
    <!-- <div v-for="integration in integrations" :key="integration.cookieKey">
      <IntegrationsCard
        :integration="integration"
        @handle-c-t-a="handleCTA(integration)"
      ></IntegrationsCard>
    </div> -->
  </section>
</template>

<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { settingsWorkspaceGeneralQuery } from '~/lib/settings/graphql/queries'

definePageMeta({
  layout: 'settings'
})

const route = useRoute()
const routeSlug = computed(() => (route.params.slug as string) || '')
const { result: workspaceResult } = useQuery(settingsWorkspaceGeneralQuery, () => ({
  slug: routeSlug.value
}))
</script>
