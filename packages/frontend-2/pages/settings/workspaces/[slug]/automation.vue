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
      <InfiniteLoading :settings="{ identifier }" @infinite="onInfiniteLoad" />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Nullable } from '@speckle/shared'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'
import { settingsWorkspacesAutomationQuery } from '~/lib/settings/graphql/queries'

definePageMeta({
  middleware: ['require-valid-workspace'],
  layout: 'settings'
})

useHead({
  title: 'Settings | Workspace - Automation'
})

const route = useRoute()
const slug = computed(() => (route.params.slug as string) || '')
const isAutomateEnabled = useIsAutomateModuleEnabled()

const {
  identifier,
  onInfiniteLoad,
  query: { result }
} = usePaginatedQuery({
  query: settingsWorkspacesAutomationQuery,
  baseVariables: computed(() => ({
    slug: slug.value,
    cursor: null as Nullable<string>
  })),
  options: () => ({
    enabled: isAutomateEnabled.value
  }),
  resolveCurrentResult: (res) => res?.workspaceBySlug?.automateFunctions,
  resolveInitialResult: () => ({
    items: [],
    cursor: undefined
  }),
  resolveNextPageVariables: (baseVars, cursor) => ({ ...baseVars, cursor }),
  resolveKey: (vars) => [vars.slug],
  resolveCursorFromVariables: (vars) => vars.cursor
})

const workspaceFunctions = computed(
  () => result?.value?.workspaceBySlug.automateFunctions.items ?? []
)
</script>
