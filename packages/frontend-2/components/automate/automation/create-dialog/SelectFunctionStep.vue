<template>
  <div>
    <FormTextInput
      label="Select function"
      :show-label="showLabel"
      :show-required="showRequired"
      name="search"
      color="foundation"
      placeholder="Search functions..."
      show-clear
      full-width
      v-bind="bind"
      v-on="on"
    />
    <div class="mt-4">
      <template v-if="queryItems?.length || loading">
        <AutomateFunctionCardView small-view>
          <AutomateFunctionCard
            v-for="fn in items"
            :key="fn.id"
            :fn="fn"
            external-more-info
            :selected="selectedFunction && selectedFunction?.id === fn.id"
            @use="
              () =>
                (selectedFunction =
                  selectedFunction && selectedFunction.id === fn.id ? undefined : fn)
            "
          />
        </AutomateFunctionCardView>
        <InfiniteLoading :settings="{ identifier }" @infinite="onInfiniteLoad" />
      </template>
      <CommonGenericEmptyState v-else :search="!!search" @clear-search="search = ''" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useDebouncedTextInput } from '@speckle/ui-components'
import { useQueryLoading } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type { CreateAutomationSelectableFunction } from '~/lib/automate/helpers/automations'
import type { Nullable, Optional } from '@speckle/shared'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'

const searchQuery = graphql(`
  query AutomationCreateDialogFunctionsSearch(
    $workspaceId: String!
    $filter: AutomateFunctionsFilter
    $cursor: String = null
  ) {
    workspace(id: $workspaceId) {
      automateFunctions(limit: 20, cursor: $cursor, filter: $filter) {
        cursor
        totalCount
        items {
          id
          ...AutomateAutomationCreateDialog_AutomateFunction
        }
      }
    }
  }
`)

const props = withDefaults(
  defineProps<{
    workspaceId?: string
    preselectedFunction: Optional<CreateAutomationSelectableFunction>
    pageSize?: Optional<number>
    showLabel?: Optional<boolean>
    showRequired?: Optional<boolean>
    isTestAutomation?: Optional<boolean>
  }>(),
  {
    showLabel: true,
    showRequired: true,
    isTestAutomation: false
  }
)
const selectedFunction = defineModel<Optional<CreateAutomationSelectableFunction>>(
  'selectedFunction',
  {
    required: true
  }
)
const { on, bind, value: search } = useDebouncedTextInput()
const loading = useQueryLoading()

const {
  identifier,
  onInfiniteLoad,
  query: { result }
} = usePaginatedQuery({
  query: searchQuery,
  baseVariables: computed(() => ({
    workspaceId: props.workspaceId ?? '',
    cursor: null as Nullable<string>,
    filter: {
      search: search.value?.length ? search.value : undefined,
      includeFeatured: props.isTestAutomation ? false : true,
      requireRelease: props.isTestAutomation ? false : true
    }
  })),
  resolveKey: (vars) => [vars.filter.search || ''],
  resolveCurrentResult: (res) => res?.workspace?.automateFunctions,
  resolveNextPageVariables: (baseVars, cursor) => ({
    ...baseVars,
    cursor
  }),
  resolveCursorFromVariables: (vars) => vars.cursor
})

const queryItems = computed(() => {
  return result.value?.workspace?.automateFunctions.items
})
const items = computed(() => {
  const baseItems = (queryItems.value || []).slice(0, props.pageSize)
  const preselectedFn = props.preselectedFunction

  if (!preselectedFn || baseItems.find((fn) => fn.id === preselectedFn.id)) {
    return baseItems
  }

  return [preselectedFn, ...baseItems]
})

watch(
  () => props.preselectedFunction,
  (newVal) => {
    if (newVal && !selectedFunction.value) {
      selectedFunction.value = newVal
    }
  },
  { immediate: true }
)
</script>
