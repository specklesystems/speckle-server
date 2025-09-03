<template>
  <div class="px-8 pt-1 pb-2">
    <div
      class="text-center bg-highlight-1 rounded-md p-2 text-body-3xs text-foreground font-medium"
    >
      {{ displayCount }} objects
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FilterData } from '~/lib/viewer/helpers/filters/types'
import { useExistenceFilterCount } from '~/lib/viewer/composables/filtering/counts'

const props = defineProps<{
  filter: FilterData
}>()

const { displayCount } = useExistenceFilterCount(props.filter)
</script>
