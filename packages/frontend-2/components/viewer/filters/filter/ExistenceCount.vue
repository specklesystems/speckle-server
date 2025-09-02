<template>
  <div class="px-8 pt-0 pb-2">
    <div
      class="text-center bg-highlight-1 rounded-md p-2 text-body-3xs text-foreground font-medium"
    >
      {{ displayCount }} objects
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ExistenceFilterCondition,
  type FilterData
} from '~/lib/viewer/helpers/filters/types'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'

const props = defineProps<{
  filter: FilterData
}>()

const { viewer } = useInjectedViewerState()

const totalObjectCount = computed(() => {
  return viewer.metadata.worldTree.value?.nodeCount
})

const displayCount = computed(() => {
  if (!props.filter.filter) return null
  if (props.filter.condition === ExistenceFilterCondition.IsNotSet) {
    return totalObjectCount.value
      ? totalObjectCount.value - props.filter.filter.objectCount
      : 0
  }
  return props.filter.filter.objectCount
})
</script>
