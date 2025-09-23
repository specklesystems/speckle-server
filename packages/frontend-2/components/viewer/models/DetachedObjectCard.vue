<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <button
    class="w-full border-b border-outline-3 p-3 cursor-pointer group text-left"
    :class="getObjectBackgroundClass()"
    @click="handleClick"
    @keydown.enter="handleClick"
    @mouseenter="handleObjectMouseEnter"
    @mouseleave="handleObjectMouseLeave"
  >
    <div class="flex flex-col gap-0.5">
      <div class="flex items-center gap-1">
        <CubeIcon class="w-3.5 h-3.5" />
        <div class="text-body-2xs font-medium text-foreground">Object</div>
      </div>
      <div class="text-body-3xs text-foreground-2">
        {{ objectId }}
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { CubeIcon } from '@heroicons/vue/24/outline'
import {
  useSelectionUtilities,
  useHighlightedObjectsUtilities
} from '~~/lib/viewer/composables/ui'

const props = defineProps<{
  objectId: string
}>()

const {
  objects: selectedObjects,
  addToSelectionFromObjectIds,
  clearSelection
} = useSelectionUtilities()
const { highlightObjects, unhighlightObjects } = useHighlightedObjectsUtilities()

const handleClick = () => {
  clearSelection()
  addToSelectionFromObjectIds([props.objectId])
}

const handleObjectMouseEnter = () => {
  if (props.objectId && typeof props.objectId === 'string') {
    highlightObjects([props.objectId])
  }
}

const handleObjectMouseLeave = () => {
  if (props.objectId && typeof props.objectId === 'string') {
    unhighlightObjects([props.objectId])
  }
}

const getObjectBackgroundClass = (): string => {
  const isSelected = selectedObjects.value.find((o) => o.id === props.objectId)

  if (isSelected) return 'bg-highlight-3 rounded-sm'
  return 'bg-foundation hover:bg-highlight-1 hover:rounded-sm'
}
</script>
