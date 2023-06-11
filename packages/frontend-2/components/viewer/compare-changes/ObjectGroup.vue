<template>
  <div
    :class="`bg-foundation-2 shadow h-24 flex items-center justify-center flex-col rounded-md min-w-0 cursor-pointer
    border-b-4 hover:bg-primary-muted
    ${isSelected ? 'border-primary bg-primary-muted' : 'border-transparent'}`"
    @click="setSelection()"
    @keypress="keyboardClick(setSelection)"
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
import { keyboardClick } from '~~/lib/common/helpers/accessibility'
import { useMixpanel } from '~~/lib/core/composables/mp'

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
      return 'in new version'
    case 'removed':
      return 'from old version'
    case 'modified':
      return 'across both versions'
    default:
      return 'across both versions'
  }
})
const mp = useMixpanel()
const setSelection = () => {
  mp.track('Viewer Action', {
    type: 'action',
    name: 'diffs',
    action: 'select-group',
    group: props.name
  })

  if (isSelected.value) return clearSelection()
  setSelectionFromObjectIds(props.objectIds)
}
</script>
