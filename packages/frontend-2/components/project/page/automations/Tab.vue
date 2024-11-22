<template>
  <div class="flex flex-col gap-y-4 md:gap-y-6">
    <ProjectPageAutomationsHeader
      v-model:search="search"
      :workspace-slug="workspaceSlug"
      :show-empty-state="shouldShowEmptyState"
      :creation-disabled-reason="disableCreateMessage"
      @new-automation="onNewAutomation"
    />
    <template v-if="loading">
      <CommonLoadingBar loading />
    </template>
    <template v-else>
      <ProjectPageAutomationsEmptyState
        v-if="shouldShowEmptyState"
        :functions="result"
        :is-automate-enabled="isAutomateEnabled"
        :creation-disabled-reason="disableCreateMessage"
        @new-automation="onNewAutomation"
      />
      <template v-else>
        <template v-if="automations.length">
          <ProjectPageAutomationsRow
            v-for="a in automations"
            :key="a.id"
            :automation="a"
            :project-id="projectId"
          />
          <InfiniteLoading :settings="{ identifier }" @infinite="onInfiniteLoad" />
        </template>
        <CommonGenericEmptyState
          v-else
          :search="!!search.length"
          @clear-search="search = ''"
        />
      </template>
    </template>
    <AutomateAutomationCreateDialog
      v-if="workspaceId"
      v-model:open="showNewAutomationDialog"
      :workspace-id="workspaceId"
      :preselected-project="project"
      :preselected-function="newAutomationTargetFn"
    />
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import {
  projectAutomationsTabAutomationsPaginationQuery,
  projectAutomationsTabQuery
} from '~/lib/projects/graphql/queries'
import type { CreateAutomationSelectableFunction } from '~/lib/automate/helpers/automations'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'
import { Roles } from '@speckle/shared'

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const search = ref('')
const isAutomateEnabled = useIsAutomateModuleEnabled()
const pageFetchPolicy = usePageQueryStandardFetchPolicy()

// Base tab query (no pagination)
const { result, loading } = useQuery(
  projectAutomationsTabQuery,
  () => ({
    projectId: projectId.value,
    search: search.value?.length ? search.value : null,
    cursor: null
  }),
  () => ({
    enabled: isAutomateEnabled.value,
    fetchPolicy: pageFetchPolicy.value
  })
)

const workspaceId = computed(() => result.value?.project?.workspace?.id)
const workspaceSlug = computed(() => result.value?.project?.workspace?.slug)

// Pagination query
const {
  identifier,
  onInfiniteLoad,
  query: { result: paginatedResult, variables: paginationVariables }
} = usePaginatedQuery({
  query: projectAutomationsTabAutomationsPaginationQuery,
  baseVariables: computed(() => ({
    projectId: projectId.value,
    search: search.value?.length ? search.value : null
  })),
  options: () => ({
    enabled: isAutomateEnabled.value
  }),
  resolveCurrentResult: (res) => res?.project?.automations,
  resolveInitialResult: () => result.value?.project?.automations,
  resolveNextPageVariables: (baseVars, cursor) => ({ ...baseVars, cursor }),
  resolveKey: (vars) => [vars.projectId, vars.search || ''],
  resolveCursorFromVariables: (vars) => vars.cursor
})

const showNewAutomationDialog = ref(false)
const newAutomationTargetFn = ref<CreateAutomationSelectableFunction>()

const project = computed(() => result.value?.project)
const automationsResult = computed(
  () =>
    paginatedResult.value?.project?.automations || result.value?.project?.automations
)

const hasAutomations = computed(() => (automationsResult.value?.totalCount ?? 1) > 0)
const automations = computed(() => automationsResult.value?.items || [])

const shouldShowEmptyState = computed(() => {
  if (!isAutomateEnabled.value) return true
  if (!hasAutomations.value && !paginationVariables.value?.search && !loading.value)
    return true
  return false
})

const disableCreateMessage = computed(() => {
  const allowedRoles: string[] = [Roles.Stream.Owner, Roles.Stream.Contributor]
  if (!allowedRoles.includes(result.value?.project?.role ?? '')) {
    return 'You must be at least a project contributor to create automations.'
  }

  if ((result.value?.project?.models?.items.length || 0) === 0) {
    return 'Your project should have at least 1 model before you can create an automation.'
  }

  return undefined
})

const onNewAutomation = (fn?: CreateAutomationSelectableFunction) => {
  newAutomationTargetFn.value = fn
  showNewAutomationDialog.value = true
}
</script>
