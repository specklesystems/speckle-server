<template>
  <div>
    <div
      :class="`flex group pl-1 justify-between items-center text-foreground cursor-pointer w-full max-w-full overflow-hidden select-none space-x-2 rounded border-l-4 hover:bg-primary-muted hover:shadow-md transition-all ${
        isSelected ? 'border-primary bg-primary-muted' : 'border-transparent'
      }`"
      @click="setSelection()"
    >
      <div class="flex space-x-2 items-center justify-left flex-shrink truncate">
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
import { useSelectionUtilities } from '~~/lib/viewer/composables/ui'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { VisualDiffMode } from '@speckle/viewer'
const {
  ui: { diff: diffState }
} = useInjectedViewerState()
const {
  clearSelection,
  setSelectionFromObjectIds,
  objects: selectedObjects
} = useSelectionUtilities()

const props = defineProps<{
  name: 'unchanged' | 'added' | 'removed' | 'modified'
  objectIds: string[]
}>()

// const isSelected = ref(false)
const color = ref(false)

const colorClasses = computed(() => {
  if (diffState.diffMode.value === VisualDiffMode.PLAIN) return 'hidden'
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

const targetObjectIds = computed(() => {})

const isSelected = computed(() => {
  const selObjsIds = selectedObjects.value.map((o) => o.id as string)
  return selObjsIds.some((id: string) => props.objectIds.includes(id))
})

const setSelection = () => {
  if (isSelected.value) return clearSelection()
  setSelectionFromObjectIds(props.objectIds)
}
</script>
