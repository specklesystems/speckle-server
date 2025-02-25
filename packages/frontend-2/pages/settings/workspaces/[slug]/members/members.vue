<template>
  <SettingsWorkspacesMembersTable :workspace="workspace" :workspace-slug="slug" />
</template>

<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { settingsWorkspacesMembersMembersQuery } from '~/lib/settings/graphql/queries'

const route = useRoute()
const slug = computed(() => (route.params.slug as string) || '')

const { result } = useQuery(settingsWorkspacesMembersMembersQuery, () => ({
  slug: slug.value
}))

const workspace = computed(() => result.value?.workspaceBySlug)
</script>
