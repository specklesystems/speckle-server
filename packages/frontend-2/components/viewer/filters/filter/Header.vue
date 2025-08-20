<template>
  <div class="flex items-center justify-between pl-2">
    <div class="flex items-center gap-2">
      <component
        :is="propertyTypeDisplay.icon"
        class="h-3 w-3"
        :class="propertyTypeDisplay.classes"
      />
      <span class="text-body-2xs text-foreground font-medium">{{ propertyName }}</span>
    </div>
    <div class="flex items-center gap-1">
      <FormButton
        v-tippy="
          'Toggle coloring for this filter (only one filter can be colored at a time)'
        "
        color="subtle"
        size="sm"
        hide-text
        :disabled="!hasFilter"
        :icon-right="isColoringActive ? 'IconColouring' : 'IconColouringOutline'"
        @click="$emit('toggleColors')"
      />
      <FormButton
        v-tippy="'Remove filter'"
        color="subtle"
        size="sm"
        hide-text
        :icon-right="X"
        @click="$emit('remove')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { FormButton } from '@speckle/ui-components'
import type { PropertyInfo } from '@speckle/viewer'
import { useInjectedViewerInterfaceState } from '~~/lib/viewer/composables/setup'
import { useFilterUtilities } from '~~/lib/viewer/composables/filtering'

const props = defineProps<{
  propertyName: string
  hasFilter: boolean
  isApplied: boolean
  filterId: string
  propertyFilter?: PropertyInfo | null
}>()

defineEmits<{
  toggleColors: []
  remove: []
}>()

const {
  filters: { activeColorFilterId }
} = useInjectedViewerInterfaceState()

const { getPropertyType, getPropertyTypeDisplay } = useFilterUtilities()

const isColoringActive = computed(() => activeColorFilterId.value === props.filterId)

const propertyTypeDisplay = computed(() => {
  if (!props.propertyFilter) {
    // Default to string type if no filter is available
    return getPropertyTypeDisplay('string')
  }

  const type = getPropertyType(props.propertyFilter)
  return getPropertyTypeDisplay(type)
})
</script>
