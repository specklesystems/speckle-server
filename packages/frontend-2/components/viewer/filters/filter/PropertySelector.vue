<template>
  <div class="px-2 mb-2">
    <FormSelectBase
      v-if="!filter.filter"
      v-model="selectedProperty"
      name="property-select"
      label="Property"
      placeholder="Select a property..."
      :items="propertyOptions"
    />
    <div v-else class="text-body-xs font-medium text-foreground">
      {{ getPropertyName(filter.filter?.key || '') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { FormSelectBase } from '@speckle/ui-components'
import { useFilterUtilities } from '~~/lib/viewer/composables/ui'

defineProps<{
  filter: { filter: { key: string } | null }
  propertyOptions: Array<{ value: string; label: string }>
}>()

const emit = defineEmits(['propertySelected'])

const { getPropertyName } = useFilterUtilities()

const selectedProperty = computed({
  get: () => undefined,
  set: (newVal: unknown) => {
    if (
      newVal &&
      !Array.isArray(newVal) &&
      typeof newVal === 'object' &&
      newVal !== null &&
      'value' in newVal
    ) {
      emit('propertySelected', (newVal as { value: string }).value)
    }
  }
})
</script>
