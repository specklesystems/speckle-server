<template>
  <div class="flex items-center justify-between pl-2">
    <div class="flex items-center gap-3">
      <Hash v-if="filter.type === FilterType.Numeric" class="h-3 w-3" />
      <CaseLower v-else class="h-3 w-3" />
      <span class="text-body-2xs text-foreground font-medium">
        {{ getPropertyName(filter.filter?.key) }}
      </span>
    </div>
    <div class="flex items-center">
      <FormButton
        v-tippy="'Remove filter'"
        color="subtle"
        size="sm"
        hide-text
        :icon-right="X"
        @click="removeFilter"
      />
      <FormButton
        v-tippy="'Toggle coloring for this property'"
        :color="isColoringActive ? 'primary' : 'subtle'"
        size="sm"
        hide-text
        :icon-right="PaintBucket"
        @click="toggleColors"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { X, PaintBucket, Hash, CaseLower } from 'lucide-vue-next'
import { FormButton } from '@speckle/ui-components'
import { useFilterUtilities } from '~~/lib/viewer/composables/filtering'
import type { FilterData } from '~/lib/viewer/helpers/filters/types'
import { FilterType } from '~/lib/viewer/helpers/filters/types'

const props = defineProps<{
  filter: FilterData
}>()

const { removeActiveFilter, toggleColorFilter, getPropertyName, filters } =
  useFilterUtilities()

const isColoringActive = computed(() => {
  return filters.activeColorFilterId.value === props.filter.id
})

const removeFilter = () => {
  removeActiveFilter(props.filter.id)
}

const toggleColors = () => {
  toggleColorFilter(props.filter.id)
}
</script>
