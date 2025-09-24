<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <button
    class="w-full h-16 pr-2 py-2 cursor-pointer group text-left bg-foundation hover:bg-highlight-1 border-b border-outline-3"
    :class="getObjectBackgroundClass()"
    @click="handleObjectClick"
    @keydown.enter="handleObjectClick"
    @mouseenter="handleObjectMouseEnter"
    @mouseleave="handleObjectMouseLeave"
  >
    <div class="flex items-center gap-1 h-full">
      <ViewerExpansionTriangle
        class="h-8"
        :is-expanded="isExpanded"
        @click="$emit('toggleExpansion', objectId)"
      />
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <CubeIcon class="w-4 h-4 shrink-0" />
        <div class="flex flex-col gap-0.5 min-w-0 flex-1">
          <div class="text-body-2xs font-medium text-foreground truncate">
            Detached Object
          </div>
          <div class="text-body-3xs text-foreground-2 truncate">
            {{ objectId }}
          </div>
        </div>
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
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import type { ExplorerNode } from '~/lib/viewer/helpers/sceneExplorer'

const props = defineProps<{
  objectId: string
  isExpanded?: boolean
}>()

const emit = defineEmits<{
  toggleExpansion: [objectId: string]
}>()

const {
  viewer: {
    metadata: { worldTree }
  }
} = useInjectedViewerState()

const {
  objects: selectedObjects,
  addToSelectionFromObjectIds,
  clearSelection
} = useSelectionUtilities()
const { highlightObjects, unhighlightObjects } = useHighlightedObjectsUtilities()

const objectNode = computed(() => {
  if (!worldTree.value) return null

  const rootNodes = worldTree.value._root.children
  return rootNodes?.find((node: ExplorerNode) => {
    const nodeObjectId = ((node.model as Record<string, unknown>).id as string)
      .split('/')
      .reverse()[0] as string
    return nodeObjectId === props.objectId
  })
})

const hasHierarchy = computed(() => {
  return objectNode.value?.model?.children && objectNode.value.model.children.length > 0
})

const handleObjectClick = () => {
  if (hasHierarchy.value) {
    if (!props.isExpanded) {
      emit('toggleExpansion', props.objectId)
    } else {
      clearSelection()
      addToSelectionFromObjectIds([props.objectId])
    }
  } else {
    clearSelection()
    addToSelectionFromObjectIds([props.objectId])
  }
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

  if (isSelected) return 'bg-highlight-3'
  return 'bg-foundation hover:bg-highlight-1'
}
</script>
