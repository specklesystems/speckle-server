<template>
  <div>
    <AutomateFunctionCardView v-if="fns.length">
      <AutomateFunctionCard
        v-for="fn in fns"
        :key="fn.id"
        :fn="fn"
        no-buttons
        @use="() => $emit('createAutomationFrom', fn)"
      />
    </AutomateFunctionCardView>
    <CommonGenericEmptyState
      v-else-if="!loading"
      :search="!!search"
      @clear-search="$emit('clearSearch')"
    />
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql'
import type {
  AutomateAutomationCreateDialog_AutomateFunctionFragment,
  AutomationsFunctionsCard_AutomateFunctionFragment
} from '~/lib/common/generated/gql/graphql'
import type { CreateAutomationSelectableFunction } from '~/lib/automate/helpers/automations'

defineEmits<{
  createAutomationFrom: [fn: CreateAutomationSelectableFunction]
  clearSearch: []
}>()

graphql(`
  fragment AutomateFunctionsPageItems_Query on Query {
    automateFunctions(limit: 6, filter: { search: $search }, cursor: $cursor) {
      totalCount
      items {
        id
        ...AutomationsFunctionsCard_AutomateFunction
        ...AutomateAutomationCreateDialog_AutomateFunction
      }
      cursor
    }
  }
`)

const props = defineProps<{
  functions?: (AutomationsFunctionsCard_AutomateFunctionFragment &
    AutomateAutomationCreateDialog_AutomateFunctionFragment)[]
  search?: boolean
  loading?: boolean
}>()

const fns = computed(() => props.functions || [])
</script>
