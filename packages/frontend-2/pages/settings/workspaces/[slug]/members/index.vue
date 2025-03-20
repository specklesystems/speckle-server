<template>
  <SettingsWorkspacesMembersTable :workspace="workspace" :workspace-slug="slug" />
</template>

<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { settingsWorkspacesMembersTableQuery } from '~/lib/settings/graphql/queries'

const route = useRoute()
const slug = computed(() => (route.params.slug as string) || '')
const { result } = useQuery(settingsWorkspacesMembersTableQuery, () => ({
  slug: slug.value
}))
const workspace = computed(() => result.value?.workspaceBySlug)
</script>
