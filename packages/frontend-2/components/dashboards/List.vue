<template>
  <div class="flex flex-col gap-y-6">
    <section class="flex items-center gap-2 justify-between">
      <h1 class="text-heading-sm md:text-heading">Intelligence</h1>

      <FormButton color="outline" @click="showCreateDashboardDialog = true">
        Add dashboard
      </FormButton>
    </section>

    <div
      v-if="!isVeryFirstLoading && !result?.workspaceBySlug?.dashboards.items.length"
      class="flex flex-col items-center justify-center gap-y-4 mx-auto my-14"
    >
      <h2 class="text-heading-sm text-foreground-2">
        This workspace has no dashboards yet
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
      <div
        v-for="dashboard in result?.workspaceBySlug?.dashboards.items"
        :key="dashboard.id"
      >
        <DashboardsCard :dashboard="dashboard" :active-workspace-slug="workspaceSlug" />
      </div>
    </div>
    <InfiniteLoading :settings="{ identifier }" @infinite="onInfiniteLoad" />

    <DashboardsCreateDialog
      v-model:open="showCreateDashboardDialog"
      :workspace-slug="workspaceSlug"
    />
  </div>
</template>

<script setup lang="ts">
import { usePaginatedQuery } from '~/lib/common/composables/graphql'
import { workspaceDashboardsQuery } from '~/lib/dashboards/graphql/queries'
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

const route = useRoute()
const workspaceSlug = computed(() => route.params.slug as string)
const { result: canCreateDashboardsResult } = useQuery(
  canCreateDashboardsQuery,
  () => ({
    slug: workspaceSlug.value
  })
)
const {
  identifier,
  onInfiniteLoad,
  isVeryFirstLoading,
  query: { result }
} = usePaginatedQuery({
  query: workspaceDashboardsQuery,
  options: computed(() => ({
    enabled: !!workspaceSlug.value
  })),
  baseVariables: computed(() => ({
    workspaceSlug: workspaceSlug.value || '',
    cursor: null as Nullable<string>
  })),
  resolveKey: () => [''],
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

const showCreateDashboardDialog = ref(false)
const canCreateDashboards = computed(
  () =>
    canCreateDashboardsResult.value?.workspaceBySlug?.permissions?.canCreateDashboards
      ?.authorized
)
</script>
