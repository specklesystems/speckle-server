<template>
  <div class="border border-outline-2 rounded-lg">
    <div class="p-1" :class="{ 'border-b border-outline-3': !collapsed }">
      <ViewerFiltersFilterHeader v-model:collapsed="collapsed" :filter="filter" />
    </div>

    <div
      v-if="filter.filter && !collapsed"
      :class="{ 'opacity-50': !filter.isApplied }"
    >
      <ViewerFiltersFilterNumeric v-if="isNumericFilter(filter)" :filter="filter" />
      <ViewerFiltersFilterString v-else :filter="filter" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FilterData } from '~/lib/viewer/helpers/filters/types'
import { isNumericFilter } from '~/lib/viewer/helpers/filters/types'

defineProps<{
  filter: FilterData
}>()

const collapsed = ref(false)
</script>
