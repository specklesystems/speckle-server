<template>
  <div
    :class="`bg-foundation-2 shadow h-24 flex items-center justify-center flex-col rounded-md min-w-0 cursor-pointer
    border-b-4 hover:bg-primary-muted
    ${isSelected ? 'border-primary bg-primary-muted' : 'border-transparent'}`"
    @click="setSelection()"
  >
    <div :class="`h2 font-bold truncate max-w-full ${color}`">
      {{ objectCount }}
    </div>
    <div>{{ name }}</div>
    <div class="text-xs text-foreground-2 px-1">{{ description }}</div>
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

const color = computed(() => {
  switch (props.name) {
    case 'added':
      return 'text-green-500'
    case 'removed':
      return 'text-rose-500'
    case 'modified':
      return 'text-yellow-500'
    case 'unchanged':
    default:
      return 'text-neutral-500'
  }
})

const isSelected = computed(() => {
  const selObjsIds = selectedObjects.value.map((o) => o.id as string)
  return selObjsIds.some((id: string) => props.objectIds.includes(id))
})

const objectCount = computed(() => {
  if (props.name === 'modified') return props.objectIds.length / 2
  return props.objectIds.length
})

const description = computed(() => {
  switch (props.name) {
    case 'added':
      return 'In A, but not in B'
    case 'removed':
      return 'In B, but not in A'
    case 'modified':
      return 'objects (in A and B)'
    default:
      return 'objects (in A and B)'
  }
})

const setSelection = () => {
  if (isSelected.value) return clearSelection()
  setSelectionFromObjectIds(props.objectIds)
}
</script>
