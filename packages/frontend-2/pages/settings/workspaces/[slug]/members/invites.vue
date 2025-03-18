<template>
  <SettingsWorkspacesMembersNewInvitesTable
    v-if="isWorkspaceNewPlansEnabled"
    :workspace="workspace"
    :workspace-slug="slug"
  />
  <SettingsWorkspacesMembersInvitesTable
    v-else
    :workspace="workspace"
    :workspace-slug="slug"
  />
</template>

<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { settingsWorkspacesMembersInvitesQuery } from '~/lib/settings/graphql/queries'

const isWorkspaceNewPlansEnabled = useWorkspaceNewPlansEnabled()

const route = useRoute()
const slug = computed(() => (route.params.slug as string) || '')

const { result } = useQuery(settingsWorkspacesMembersInvitesQuery, () => ({
  slug: slug.value
}))

const workspace = computed(() => result.value?.workspaceBySlug)
</script>
