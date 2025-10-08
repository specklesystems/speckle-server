<template>
  <div class="flex flex-col gap-y-6 pt-3">
    <section class="flex flex-col md:flex-row md:items-center gap-2 justify-between">
      <h1 class="text-heading-lg">Dashboards</h1>

      <div class="flex space-x-2 items-center">
        <FormTextInput
          v-model="localSearch"
          name="dashboardsearch"
          :show-label="false"
          placeholder="Search dashboards..."
          color="foundation"
          wrapper-classes="grow min-w-40"
          :show-clear="localSearch !== ''"
        />

        <FormButton color="outline" @click="showCreateDashboardDialog = true">
          Add dashboard
        </FormButton>
      </div>
    </section>

    <div
      v-if="!isVeryFirstLoading && !dashboards?.items.length"
      class="flex flex-col items-center justify-center gap-y-4 mx-auto my-14"
    >
      <h2 class="text-heading-sm text-foreground-2">
        {{
          localSearch.trim()
            ? 'No dashboards found matching your search'
            : props.projectId
            ? 'This project has no dashboards yet'
            : 'This workspace has no dashboards yet'
        }}
      </h2>
      <FormButton
        v-if="canCreateDashboards"
        color="outline"
        @click="showCreateDashboardDialog = true"
      >
        Add dashboard
      </FormButton>
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="dashboard in dashboards?.items" :key="dashboard.id">
        <DashboardsCard
          :dashboard="dashboard"
          :active-workspace-slug="effectiveWorkspaceSlug"
        />
      </div>
    </div>
    <InfiniteLoading :settings="{ identifier }" @infinite="onInfiniteLoad" />

    <DashboardsCreateDialog
      v-model:open="showCreateDashboardDialog"
      :workspace-slug="effectiveWorkspaceSlug"
    />
  </div>
</template>

<script setup lang="ts">
import { usePaginatedQuery } from '~/lib/common/composables/graphql'
import {
  workspaceDashboardsQuery,
  projectDashboardsQuery
} from '~/lib/dashboards/graphql/queries'
import type { Nullable } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'

const canCreateDashboardsQuery = graphql(`
  query DashboardsListCanCreateDashboards($slug: String!) {
    workspaceBySlug(slug: $slug) {
      permissions {
        canCreateDashboards {
          ...FullPermissionCheckResult
        }
      }
    }
  }
`)

const props = defineProps<{
  workspaceSlug?: string
  projectId?: string
}>()

const route = useRoute()

const showCreateDashboardDialog = ref(false)
const localSearch = ref('')

const workspaceSlug = computed(
  () => props.workspaceSlug || (route.params.slug as string)
)

const effectiveWorkspaceSlug = computed(() => {
  if (props.workspaceSlug) return props.workspaceSlug
  if (props.projectId) return projectResult.value?.project?.workspace?.slug
  return route.params.slug as string
})

const {
  identifier: workspaceIdentifier,
  onInfiniteLoad: onWorkspaceInfiniteLoad,
  isVeryFirstLoading: isWorkspaceLoading,
  query: { result: workspaceResult }
} = usePaginatedQuery({
  query: workspaceDashboardsQuery,
  options: computed(() => ({
    enabled: !!props.workspaceSlug && !!workspaceSlug.value
  })),
  baseVariables: computed(() => ({
    workspaceSlug: workspaceSlug.value || '',
    cursor: null as Nullable<string>,
    filter: {
      search: localSearch.value.trim() || null
    }
  })),
  resolveKey: () => ['workspace', localSearch.value],
  resolveCurrentResult: (res) =>
    res?.workspaceBySlug?.dashboards
      ? {
          totalCount: res.workspaceBySlug.dashboards.items.length,
          items: res.workspaceBySlug.dashboards.items
        }
      : undefined,
  resolveNextPageVariables: (baseVars, cursor) => ({
    ...baseVars,
    cursor
  }),
  resolveCursorFromVariables: (vars) => vars.cursor
})

const {
  identifier: projectIdentifier,
  onInfiniteLoad: onProjectInfiniteLoad,
  isVeryFirstLoading: isProjectLoading,
  query: { result: projectResult }
} = usePaginatedQuery({
  query: projectDashboardsQuery,
  options: computed(() => ({
    enabled: !!props.projectId
  })),
  baseVariables: computed(() => ({
    projectId: props.projectId || '',
    cursor: null as Nullable<string>,
    filter: {
      search: localSearch.value.trim() || null
    }
  })),
  resolveKey: () => ['project', localSearch.value],
  resolveCurrentResult: (res) =>
    res?.project?.dashboards
      ? {
          totalCount: res.project.dashboards.items.length,
          items: res.project.dashboards.items
        }
      : undefined,
  resolveNextPageVariables: (baseVars, cursor) => ({
    ...baseVars,
    cursor
  }),
  resolveCursorFromVariables: (vars) => vars.cursor
})

const { result: canCreateDashboardsResult } = useQuery(
  canCreateDashboardsQuery,
  () => ({
    slug: effectiveWorkspaceSlug.value || ''
  }),
  {
    enabled: computed(() => !!effectiveWorkspaceSlug.value)
  }
)

const dashboards = computed(() =>
  props.workspaceSlug
    ? workspaceResult.value?.workspaceBySlug?.dashboards
    : projectResult.value?.project?.dashboards
)

const identifier = computed(() =>
  props.workspaceSlug ? workspaceIdentifier.value : projectIdentifier.value
)

const isVeryFirstLoading = computed(() =>
  props.workspaceSlug ? isWorkspaceLoading.value : isProjectLoading.value
)

const onInfiniteLoad = computed(() =>
  props.workspaceSlug ? onWorkspaceInfiniteLoad : onProjectInfiniteLoad
)

const canCreateDashboards = computed(() => {
  return canCreateDashboardsResult.value?.workspaceBySlug?.permissions
    ?.canCreateDashboards?.authorized
})
</script>
