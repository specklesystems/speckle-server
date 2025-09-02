<template>
  <div class="px-8 pt-0 pb-2">
    <div
      class="text-center bg-highlight-1 rounded-md p-2 text-body-3xs text-foreground font-medium"
    >
      {{ displayCount?.toLocaleString() }} objects
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FilterData } from '~/lib/viewer/helpers/filters/types'
import { ExistenceFilterCondition } from '~/lib/viewer/helpers/filters/types'
import { useFilterCounts } from '~/lib/viewer/composables/filtering/counts'

const props = defineProps<{
  filter: FilterData
}>()

const { getExistenceCounts } = useFilterCounts()

const existenceCounts = computed(() => {
  if (!props.filter.filter) return null
  return getExistenceCounts(props.filter.filter)
})

const displayCount = computed(() => {
  if (!existenceCounts.value) return null

  if (props.filter.condition === ExistenceFilterCondition.IsSet) {
    return existenceCounts.value.setCount
  } else if (props.filter.condition === ExistenceFilterCondition.IsNotSet) {
    return existenceCounts.value.notSetCount
  }

  return null
})
</script>
