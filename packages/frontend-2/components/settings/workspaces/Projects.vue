<template>
  <section>
    <div class="md:max-w-5xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader
        title="Projects"
        text="Manage projects in your workspace"
      />
      <SettingsSharedProjects
        v-model:search="search"
        :projects="projects"
        :workspace-id="workspaceId"
        @close="$emit('close')"
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

graphql(`
  fragment SettingsWorkspacesProjects_ProjectCollection on ProjectCollection {
    totalCount
    items {
      ...SettingsSharedProjects_Project
    }
  }
`)

const props = defineProps<{
  workspaceId: string
}>()

defineEmits<{
  (e: 'close'): void
}>()

const search = ref('')

const {
  identifier,
  onInfiniteLoad,
  query: { result }
} = usePaginatedQuery({
  query: settingsWorkspacesProjectsQuery,
  baseVariables: computed(() => ({
    limit: 50,
    filter: { search: search.value?.length ? search.value : null },
    workspaceId: props.workspaceId
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
</script>
