<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div
    class="rounded-md p-2 flex items-center gap-3"
    :class="[
      isSelected ? '' : 'border-transparent',
      objectCount > 0 ? 'cursor-pointer hover:bg-highlight-1' : ''
    ]"
    @click="setSelection()"
    @keypress="keyboardClick(setSelection)"
  >
    <div class="shrink-0 h-10 w-1 rounded-full" :class="color" />
    <div class="flex flex-col">
      <div class="text-body-xs font-medium capitalize">{{ name }}</div>
      <div class="text-body-xs font-medium text-foreground-2 -mt-0.5">
        {{ description }}
      </div>
    </div>
    <div class="text-heading-lg font-medium ml-auto">
      {{ objectCount }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { useSelectionUtilities } from '~~/lib/viewer/composables/ui'
import { keyboardClick } from '@speckle/ui-components'
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
  const objectIdsSet = new Set(props.objectIds)
  return selObjsIds.some((id: string) => objectIdsSet.has(id))
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
