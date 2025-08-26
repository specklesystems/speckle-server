<template>
  <div class="pt-1">
    <ViewerFiltersFilterConditionSelector
      :filter="filter"
      class="pl-9"
      @select-condition="handleConditionSelect"
    />

    <ViewerSearchInput
      v-if="!collapsed"
      v-model="searchQuery"
      placeholder="Search for a value..."
      class="pl-1 -mt-0.5"
    />

    <ViewerFiltersFilterStringCheckboxes :filter="filter" :search-query="searchQuery" />
  </div>
</template>

<script setup lang="ts">
import type { FilterData, ConditionOption } from '~/lib/viewer/helpers/filters/types'
import { useFilterUtilities } from '~~/lib/viewer/composables/filtering'

const props = defineProps<{
  filter: FilterData
}>()

const collapsed = ref(false)
const searchQuery = ref('')

const { updateFilterCondition } = useFilterUtilities()

const handleConditionSelect = (conditionOption: ConditionOption) => {
  updateFilterCondition(props.filter.id, conditionOption.value)
}
</script>
