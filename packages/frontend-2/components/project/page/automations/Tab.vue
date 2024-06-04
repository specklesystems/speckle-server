<template>
  <div class="flex flex-col gap-8">
    <ProjectPageAutomationsHeader
      v-model:search="search"
      :has-automations="hasAutomations && isAutomateEnabled"
      @new-automation="onNewAutomation"
    />
    <template v-if="loading">
      <CommonLoadingBar loading />
    </template>
    <template v-else>
      <ProjectPageAutomationsEmptyState
        v-if="!hasAutomations || !isAutomateEnabled"
        :functions="result"
        :is-automate-enabled="isAutomateEnabled"
        @new-automation="onNewAutomation"
      />
      <template v-else>
        <ProjectPageAutomationsRow
          v-for="a in automations"
          :key="a.id"
          :automation="a"
          :project-id="projectId"
        />
        <InfiniteLoading :settings="{ identifier }" @infinite="onInfiniteLoad" />
      </template>
    </template>
    <AutomateAutomationCreateDialog
      v-model:open="showNewAutomationDialog"
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

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const search = ref('')
const isAutomateEnabled = useIsAutomateModuleEnabled()

// Base tab query (no pagination)
const { result, loading } = useQuery(
  projectAutomationsTabQuery,
  () => ({
    projectId: projectId.value,
    search: search.value?.length ? search.value : null,
    // TODO: Pagination & search
    cursor: null
  }),
  () => ({
    enabled: isAutomateEnabled.value
  })
)

// Pagination query
const {
  identifier,
  onInfiniteLoad,
  query: { result: paginatedResult }
} = usePaginatedQuery({
  query: projectAutomationsTabAutomationsPaginationQuery,
  baseVariables: computed(() => ({
    projectId: projectId.value,
    search: search.value?.length ? search.value : null
  })),
  resolveCurrentResult: (res) => res?.project?.automations,
  resolveInitialResult: () => result.value?.project?.automations,
  resolveNextPageVariables: (baseVars, cursor) => ({ ...baseVars, cursor }),
  resolveKey: (vars) => [vars.projectId, vars.search || '']
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

const onNewAutomation = (fn?: CreateAutomationSelectableFunction) => {
  newAutomationTargetFn.value = fn
  showNewAutomationDialog.value = true
}
</script>
