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
import type {
  AutomateAutomationCreateDialog_AutomateFunctionFragment,
  AutomationsFunctionsCard_AutomateFunctionFragment
} from '~/lib/common/generated/gql/graphql'
import type { CreateAutomationSelectableFunction } from '~/lib/automate/helpers/automations'

defineEmits<{
  createAutomationFrom: [fn: CreateAutomationSelectableFunction]
  clearSearch: []
}>()

const props = defineProps<{
  functions?: (AutomationsFunctionsCard_AutomateFunctionFragment &
    AutomateAutomationCreateDialog_AutomateFunctionFragment)[]
  search?: boolean
  loading?: boolean
}>()

const fns = computed(() => props.functions || [])
</script>
