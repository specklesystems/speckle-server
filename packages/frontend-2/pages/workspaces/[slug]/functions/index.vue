<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink
        :to="workspaceFunctionsRoute('')"
        name="Functions"
        :separator="false"
      />
    </Portal>
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-2 mb-2">
        <IconBolt class="h-5 w-5" />
        <h1 class="text-heading-lg">Workspace functions</h1>
      </div>
      <AutomateFunctionsPageHeader
        v-model:search="search"
        :active-user="result?.activeUser"
        :server-info="result?.serverInfo"
        class="mb-6"
      />
    </div>

    <CommonLoadingBar :loading="pageQueryLoading" client-only class="mb-2" />
    <AutomateFunctionsPageItems
      :functions="finalResult"
      :search="!!search"
      :loading="paginationLoading"
      @create-automation-from="openCreateNewAutomation"
      @clear-search="search = ''"
    />
    <!-- <InfiniteLoading :settings="{ identifier }" @infinite="onInfiniteLoad" /> -->

    <AutomateAutomationCreateDialog
      v-model:open="showNewAutomationDialog"
      :preselected-function="newAutomationTargetFn"
    />
  </div>
</template>
<script setup lang="ts">
import { CommonLoadingBar } from '@speckle/ui-components'
import { useQuery } from '@vue/apollo-composable'
import {
  activeUserFunctionsQuery,
  automateFunctionsPagePaginationQuery
} from '~/lib/automate/graphql/queries'
import type { CreateAutomationSelectableFunction } from '~/lib/automate/helpers/automations'
import {
  usePageQueryStandardFetchPolicy,
  usePaginatedQuery
} from '~/lib/common/composables/graphql'
import { graphql } from '~/lib/common/generated/gql'
import {
  automationFunctionsRoute,
  workspaceFunctionsRoute,
  workspaceRoute
} from '~/lib/common/helpers/route'

definePageMeta({
  middleware: ['auth', 'requires-automate-enabled']
})

const pageQuery = graphql(`
  query WorkspaceFunctionsPage($workspaceId: String!, $search: String, $cursor: String = null) {
    workspace(id: $workspaceId) {
      automateFunctions() {
        items
        totalCount
        cursor
      }
    }
  }
`)

const search = ref('')
const pageFetchPolicy = usePageQueryStandardFetchPolicy()
const { result, loading: pageQueryLoading } = useQuery(
  pageQuery,
  () => ({
    search: search.value?.length ? search.value : null
  }),
  () => ({
    fetchPolicy: pageFetchPolicy.value
  })
)

const {
  identifier,
  onInfiniteLoad,
  query: { result: paginatedResult, loading: paginationLoading }
} = usePaginatedQuery({
  query: automateFunctionsPagePaginationQuery,
  baseVariables: computed(() => ({
    search: search.value?.length ? search.value : null
  })),
  resolveKey: (vars) => [vars.search || ''],
  resolveCurrentResult: (res) => res?.automateFunctions,
  resolveInitialResult: () => result.value?.workspace?.automateFunctions,
  resolveNextPageVariables: (baseVars, cursor) => ({
    ...baseVars,
    cursor
  }),
  resolveCursorFromVariables: (vars) => vars.cursor,
  options: () => ({
    fetchPolicy: pageFetchPolicy.value
  })
})

const showNewAutomationDialog = ref(false)
const newAutomationTargetFn = ref<CreateAutomationSelectableFunction>()

const finalResult = computed(() => paginatedResult.value || result.value)

const openCreateNewAutomation = (fn: CreateAutomationSelectableFunction) => {
  newAutomationTargetFn.value = fn
  showNewAutomationDialog.value = true
}
</script>
