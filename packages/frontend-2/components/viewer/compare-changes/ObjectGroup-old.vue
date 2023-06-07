<template>
  <div>
    <div
      :class="`flex group justify-between pl-1 py-1 items-center text-foreground cursor-pointer w-full max-w-full overflow-hidden select-none rounded border-l-4 hover:bg-primary-muted hover:shadow-md transition-all ${
        isSelected ? 'border-primary bg-primary-muted' : 'border-transparent'
      }`"
      @click="setSelection()"
      @keypress="keyboardClick(setSelection)"
    >
      <div class="flex space-x-2 items-center truncate">
        <span :class="`w-3 h-3 rounded ${colorClasses}`"></span>
        <span class="truncate">
          {{ name }}
        </span>
        <span class="text-xs text-foreground-2">({{ objectIds.length }})</span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { keyboardClick } from '~~/lib/common/helpers/accessibility'
import { useSelectionUtilities } from '~~/lib/viewer/composables/ui'

const {
  clearSelection,
  setSelectionFromObjectIds,
  objects: selectedObjects
} = useSelectionUtilities()

const props = defineProps<{
  name: 'unchanged' | 'added' | 'removed' | 'modified'
  objectIds: string[]
}>()

const colorClasses = computed(() => {
  switch (props.name) {
    case 'added':
      return 'bg-green-500'
    case 'removed':
      return 'bg-rose-500'
    case 'modified':
      return 'bg-yellow-500'
    case 'unchanged':
    default:
      return 'bg-neutral-500'
  }
})

const isSelected = computed(() => {
  const selObjsIds = selectedObjects.value.map((o) => o.id as string)
  return selObjsIds.some((id: string) => props.objectIds.includes(id))
})

const setSelection = () => {
  if (isSelected.value) return clearSelection()
  setSelectionFromObjectIds(props.objectIds)
}
</script>
