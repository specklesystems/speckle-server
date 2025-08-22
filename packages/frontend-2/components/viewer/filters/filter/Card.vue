<template>
  <div class="border border-outline-2 rounded-lg">
    <div class="border-b border-outline-3 p-1 pb-0.5">
      <ViewerFiltersFilterHeader :filter="filter" />

      <ViewerFiltersFilterConditionSelector
        :filter="filter"
        @select-condition="$emit('selectCondition', $event)"
      />

      <ViewerSearchInput
        v-if="filter.type === FilterType.String"
        v-model="searchQuery"
        placeholder="Search for a value..."
      />
    </div>

    <div v-if="filter.filter">
      <ViewerFiltersFilterValuesNumericRange
        v-if="isNumericFilter(filter)"
        :filter="filter"
      />

      <ViewerFiltersFilterValuesStringCheckboxes
        v-else
        :filter="filter"
        :search-query="searchQuery"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FilterData } from '~/lib/viewer/helpers/filters/types'
import { FilterType, isNumericFilter } from '~/lib/viewer/helpers/filters/types'

defineProps<{
  filter: FilterData
}>()

defineEmits(['selectCondition'])

const searchQuery = ref('')
</script>
