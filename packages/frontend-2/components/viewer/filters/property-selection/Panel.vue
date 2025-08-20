<template>
  <div class="h-full flex flex-col">
    <ViewerFiltersPropertySelectionSearch
      v-model="searchQuery"
      placeholder="Search for a property..."
      input-id="property-search"
    />

    <div class="flex-1 overflow-y-auto overflow-x-hidden simple-scrollbar p-2">
      <div class="flex flex-col">
        <button
          v-for="property in filteredOptions"
          :key="property.value"
          class="p-2 text-foreground rounded hover:bg-highlight-1 text-left flex items-center gap-2"
          @click="$emit('selectProperty', property.value)"
        >
          <component
            :is="getPropertyTypeDisplay(property.type).icon"
            class="h-3 w-3 shrink-0"
            :class="getPropertyTypeDisplay(property.type).classes"
          />
          <div class="min-w-0 flex-1">
            <div class="text-body-2xs font-medium text-foreground truncate">
              {{ property.label }}
            </div>
            <div
              v-if="property.parentPath"
              class="text-body-3xs text-foreground-2 truncate -mt-1"
            >
              {{ property.parentPath }}
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFilterUtilities } from '~~/lib/viewer/composables/filtering'

type PropertyOption = {
  value: string
  label: string
  parentPath: string
  type: 'number' | 'string'
  hasParent: boolean
}

const props = defineProps<{
  options: PropertyOption[]
}>()

defineEmits<{
  selectProperty: [propertyKey: string]
}>()

const searchQuery = ref('')

const { getPropertyTypeDisplay } = useFilterUtilities()

const filteredOptions = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.options
  }

  const searchTerm = searchQuery.value.toLowerCase().trim()
  return props.options.filter(
    (option) =>
      option.label.toLowerCase().includes(searchTerm) ||
      option.value.toLowerCase().includes(searchTerm) ||
      option.parentPath.toLowerCase().includes(searchTerm) ||
      option.type.toLowerCase().includes(searchTerm)
  )
})
</script>
