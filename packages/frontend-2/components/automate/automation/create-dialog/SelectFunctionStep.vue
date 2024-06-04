<template>
  <div>
    <FormTextInput
      label="Select Function"
      :show-label="showLabel"
      :show-required="showRequired"
      name="search"
      color="foundation"
      placeholder="Search Functions..."
      show-clear
      :model-value="bind.modelValue.value"
      full-width
      v-on="on"
    />
    <div class="mt-4">
      <CommonLoadingBar :loading="loading" />
      <template v-if="!loading">
        <AutomateFunctionCardView v-if="queryItems?.length" small-view>
          <AutomateFunctionCard
            v-for="fn in items"
            :key="fn.id"
            :fn="fn"
            external-more-info
            :selected="selectedFunction && selectedFunction?.id === fn.id"
            @use="() => (selectedFunction = fn)"
          />
        </AutomateFunctionCardView>
        <CommonGenericEmptyState
          v-else
          :search="!!search"
          @clear-search="search = ''"
        />
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useDebouncedTextInput } from '@speckle/ui-components'
import { useQueryLoading, useQuery } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type { CreateAutomationSelectableFunction } from '~/lib/automate/helpers/automations'
import type { Optional } from '@speckle/shared'

// TODO: Pagination

const searchQuery = graphql(`
  query AutomationCreateDialogFunctionsSearch($search: String) {
    automateFunctions(limit: 21, filter: { search: $search }) {
      items {
        id
        ...AutomateAutomationCreateDialog_AutomateFunction
      }
    }
  }
`)

const props = withDefaults(
  defineProps<{
    preselectedFunction: Optional<CreateAutomationSelectableFunction>
    pageSize?: Optional<number>
    showLabel?: Optional<boolean>
    showRequired?: Optional<boolean>
  }>(),
  {
    showLabel: true,
    showRequired: true
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
const { result } = useQuery(searchQuery, () => ({
  search: search.value?.length ? search.value : null
}))

const queryItems = computed(() => result.value?.automateFunctions.items)
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
