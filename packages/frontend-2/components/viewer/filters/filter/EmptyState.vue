<template>
  <div class="flex-1 flex flex-col gap-3 items-center justify-between">
    <div class="h-8" />
    <div class="flex flex-col gap-4 items-center">
      <IllustrationEmptystateFiltersTab />
      <div class="text-foreground-2 text-heading-sm">There are no filters, yet.</div>
      <FormButton color="outline" @click="$emit('addFilter')">Add filter</FormButton>
    </div>
    <!-- Popular filters section -->
    <div
      v-if="availablePopularFilters.length > 0"
      class="flex flex-col gap-2 items-center mt-4 px-2"
    >
      <div class="text-foreground-2 text-body-2xs">Or add popular filters:</div>
      <!-- Setting max-height with overflow so this never goes into 3 lines -->
      <div
        class="flex flex-wrap gap-1 justify-center max-w-xs max-h-14 overflow-hidden"
      >
        <FormButton
          v-for="filter in availablePopularFilters"
          :key="filter.value"
          color="outline"
          size="sm"
          :icon-left="Plus"
          class="text-xs"
          @click="$emit('addPopularFilter', filter.value)"
        >
          {{ filter.label }}
        </FormButton>
      </div>
    </div>
    <div v-else />
  </div>
</template>

<script setup lang="ts">
import { FormButton } from '@speckle/ui-components'
import { useFilterUtilities } from '~/lib/viewer/composables/filtering/filtering'
import { Plus } from 'lucide-vue-next'

const { getAvailablePopularFilters } = useFilterUtilities()

defineEmits<{
  addFilter: []
  addPopularFilter: [propertyKey: string]
}>()

const availablePopularFilters = computed(() => getAvailablePopularFilters(6))
</script>
