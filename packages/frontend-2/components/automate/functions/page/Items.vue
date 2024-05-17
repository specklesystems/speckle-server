<template>
  <div>
    <AutomateFunctionCardView v-if="fns.length">
      <AutomateFunctionCard
        v-for="fn in fns"
        :key="fn.id"
        :fn="fn"
        @use="() => $emit('createAutomationFrom', fn)"
      />
    </AutomateFunctionCardView>
    <CommonGenericEmptyState
      v-else
      :search="!!search"
      @clear-search="$emit('clearSearch')"
    />
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql'
import type { AutomateFunctionsPageItems_QueryFragment } from '~/lib/common/generated/gql/graphql'
import type { CreateAutomationSelectableFunction } from '~/lib/automate/helpers/automations'

// TODO: Pagination

defineEmits<{
  createAutomationFrom: [fn: CreateAutomationSelectableFunction]
  clearSearch: []
}>()

graphql(`
  fragment AutomateFunctionsPageItems_Query on Query {
    automateFunctions(limit: 21, filter: { search: $search }) {
      items {
        ...AutomationsFunctionsCard_AutomateFunction
        ...AutomateAutomationCreateDialog_AutomateFunction
      }
    }
  }
`)

const props = defineProps<{
  functions?: AutomateFunctionsPageItems_QueryFragment
  search?: boolean
}>()

const fns = computed(() => props.functions?.automateFunctions.items || [])
</script>
