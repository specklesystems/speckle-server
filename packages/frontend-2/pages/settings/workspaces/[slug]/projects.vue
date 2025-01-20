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
        :workspace-id="workspaceId"
        :disable-create="result?.workspace.readOnly"
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
import { workspaceGetIdBySlugQuery } from '~~/lib/workspaces/graphql/queries'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'
import { graphql } from '~/lib/common/generated/gql'
import { useWorkspaceProjectsUpdatedTracking } from '~/lib/workspaces/composables/projectUpdates'
import { useQuery } from '@vue/apollo-composable'

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

const slug = computed(() => (route.params.slug as string) || '')

const route = useRoute()
const { result: workspaceResult } = useQuery(workspaceGetIdBySlugQuery, () => ({
  slug: slug.value
}))
const workspaceId = computed(() => workspaceResult.value?.workspaceBySlug.id || '')

const search = ref('')

const {
  identifier,
  onInfiniteLoad,
  query: { result, loading }
} = usePaginatedQuery({
  query: settingsWorkspacesProjectsQuery,
  baseVariables: computed(() => ({
    limit: 50,
    filter: { search: search.value?.length ? search.value : null },
    workspaceId: workspaceId.value,
    enabled: !!workspaceId.value
  })),
  resolveKey: (vars) => [vars.workspaceId, vars.filter?.search || ''],
  resolveCurrentResult: (res) => res?.workspace.projects,
  resolveNextPageVariables: (baseVars, cursor) => ({
    ...baseVars,
    cursor
  }),
  resolveCursorFromVariables: (vars) => vars.cursor
})

const projects = computed(() => result.value?.workspace.projects.items || [])
useWorkspaceProjectsUpdatedTracking(computed(() => slug.value))
</script>
