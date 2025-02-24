<template>
  <div class="flex flex-col gap-y-4 md:gap-y-6">
    <ProjectPageAutomationsHeader
      v-model:search="search"
      :workspace-slug="workspace?.slug"
      :show-header="!shouldShowEmptyState && !loading"
      :creation-disabled-message="disableCreateAutomationMessage"
      @new-automation="onNewAutomation"
    />
    <template v-if="loading">
      <CommonLoadingBar loading />
    </template>
    <template v-else>
      <ProjectPageAutomationsEmptyState
        v-if="shouldShowEmptyState"
        :workspace-slug="workspace?.slug"
        :hidden-actions="hiddenActions"
        :disabled-actions="disabledActions"
        @new-automation="onNewAutomation"
        @new-function="onNewFunction"
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
      v-if="workspace?.id"
      v-model:open="showNewAutomationDialog"
      :workspace-id="workspace?.id"
      :preselected-project="project"
      :preselected-function="newAutomationTargetFn"
    />
    <AutomateFunctionCreateDialog
      v-model:open="showNewFunctionDialog"
      :workspace="workspace"
      :is-authorized="isGithubAppConfigured"
      :github-orgs="githubOrgs"
      :templates="availableFunctionTemplates"
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
import { Roles, type Nullable } from '@speckle/shared'
import type { AutomateOnboardingAction } from '~/components/project/page/automations/EmptyState.vue'

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

const workspace = computed(() => result.value?.project?.workspace ?? undefined)

const workspaceFunctionCount = computed(
  () => result.value?.project.workspace?.automateFunctions.totalCount ?? 0
)
const hiddenActions = computed<AutomateOnboardingAction[]>(() => {
  return workspaceFunctionCount.value > 0 ? [] : ['view-functions']
})
const disabledActions = computed<
  { action: AutomateOnboardingAction; reason: string }[]
>(() => {
  if (workspaceFunctionCount.value === 0) {
    return [
      {
        action: 'create-automation',
        reason:
          'You must create at least one function before you can create an automation.'
      }
    ]
  }
  if (result.value?.project?.role !== Roles.Stream.Owner) {
    return [
      {
        action: 'create-automation',
        reason: 'Only project owners can create new automations.'
      }
    ]
  }
  if ((result.value?.project?.models?.items.length || 0) === 0) {
    return [
      {
        action: 'create-automation',
        reason:
          'Your project should have at least 1 model before you can create an automation.'
      }
    ]
  }
  return []
})
const disableCreateAutomationMessage = computed(
  () =>
    disabledActions.value?.find((entry) => entry.action === 'create-automation')?.reason
)

const isGithubAppConfigured = computed(
  () => !!result.value?.activeUser?.automateInfo.hasAutomateGithubApp
)
const githubOrgs = computed(
  () => result.value?.activeUser?.automateInfo.availableGithubOrgs || []
)
const availableFunctionTemplates = computed(
  () => result.value?.serverInfo.automate.availableFunctionTemplates || []
)

// Pagination query
const {
  identifier,
  onInfiniteLoad,
  query: { result: paginatedResult, variables: paginationVariables }
} = usePaginatedQuery({
  query: projectAutomationsTabAutomationsPaginationQuery,
  baseVariables: computed(() => ({
    projectId: projectId.value,
    search: search.value?.length ? search.value : null,
    cursor: null as Nullable<string>
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

const showNewFunctionDialog = ref(false)
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

const onNewAutomation = (fn?: CreateAutomationSelectableFunction) => {
  newAutomationTargetFn.value = fn
  showNewAutomationDialog.value = true
}

const onNewFunction = () => {
  showNewFunctionDialog.value = true
}
</script>
