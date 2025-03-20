<template>
  <section>
    <div class="md:max-w-5xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader
        title="Projects"
        text="Manage projects in your workspace"
      />
      <div v-if="loading && !projects.length" class="flex justify-center py-8">
        <CommonLoadingIcon />
      </div>
      <SettingsSharedProjects
        v-else
        v-model:search="search"
        :projects="projects"
        :workspace-id="result?.workspaceBySlug.id"
        :disable-create="result?.workspaceBySlug.readOnly"
      />
      <InfiniteLoading
        v-if="projects?.length"
        :settings="{ identifier }"
        class="py-4"
        @infinite="onInfiniteLoad"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { settingsWorkspacesProjectsQuery } from '~~/lib/settings/graphql/queries'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'
import { graphql } from '~/lib/common/generated/gql'
import { useWorkspaceProjectsUpdatedTracking } from '~/lib/workspaces/composables/projectUpdates'
import type { Nullable } from '@speckle/shared'

graphql(`
  fragment SettingsWorkspacesProjects_ProjectCollection on ProjectCollection {
    totalCount
    items {
      ...SettingsSharedProjects_Project
    }
  }
`)

definePageMeta({
  layout: 'settings'
})

useHead({
  title: 'Settings | Workspace - Projects'
})

const route = useRoute()

const search = ref('')

const slug = computed(() => (route.params.slug as string) || '')

const {
  identifier,
  onInfiniteLoad,
  query: { result, loading }
} = usePaginatedQuery({
  query: settingsWorkspacesProjectsQuery,
  baseVariables: computed(() => ({
    limit: 50,
    filter: { search: search.value?.length ? search.value : null },
    slug: slug.value,
    cursor: null as Nullable<string>
  })),
  resolveKey: (vars) => [vars.slug, vars.filter?.search || ''],
  resolveCurrentResult: (res) => res?.workspaceBySlug.projects,
  resolveNextPageVariables: (baseVars, cursor) => ({
    ...baseVars,
    cursor
  }),
  resolveCursorFromVariables: (vars) => vars.cursor
})

const projects = computed(() => result.value?.workspaceBySlug.projects.items || [])
useWorkspaceProjectsUpdatedTracking(computed(() => slug.value))
</script>
