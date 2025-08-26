<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div
    class="flex items-center justify-between"
    :class="{ 'cursor-pointer': collapsed }"
    @click="toggleCollapsed"
  >
    <div class="flex items-center">
      <ViewerExpansionTriangle
        :is-expanded="!collapsed"
        class="h-6"
        @click="collapsed = !collapsed"
      />
      <Hash v-if="filter.type === FilterType.Numeric" class="h-3 w-3" />
      <CaseLower v-else class="h-3 w-3" />
      <div class="text-body-2xs text-foreground font-medium pl-1">
        {{ getPropertyName(filter.filter?.key) }}
      </div>
    </div>
    <div class="flex items-center">
      <FormButton
        v-tippy="'Toggle coloring for this property'"
        :color="isColoringActive ? 'primary' : 'subtle'"
        size="sm"
        hide-text
        :icon-right="PaintBucket"
        @click.stop="toggleColors"
      />
      <FormButton
        v-tippy="'Remove filter'"
        color="subtle"
        size="sm"
        hide-text
        :icon-right="X"
        @click.stop="removeFilter"
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

const collapsed = defineModel<boolean>('collapsed', { required: true })

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

const toggleCollapsed = () => {
  if (collapsed.value) {
    collapsed.value = false
  }
}
</script>
