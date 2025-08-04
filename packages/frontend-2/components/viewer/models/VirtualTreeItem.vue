<template>
  <div
    class="px-1"
    :class="{
      'pt-1': item.isFirstChildOfModel,
      'pb-1': item.isLastChildOfModel,
      'border-b border-outline-3': item.isLastChildOfModel
    }"
  >
    <button
      type="button"
      class="flex items-center justify-between w-full p-1 cursor-pointer text-left h-10"
      :class="[getItemBackgroundClass(), getItemOpacityClass()]"
      @click="handleItemClick($event)"
      @mouseenter="handleItemMouseEnter()"
      @mouseleave="handleItemMouseLeave()"
      @focusin="handleItemMouseEnter()"
      @focusout="handleItemMouseLeave()"
    >
      <div class="flex items-center gap-0.5 min-w-0">
        <div
          :style="{ width: `${(item.indent || 0) * 0.375}rem` }"
          class="shrink-0"
        ></div>

        <ViewerExpansionTriangle
          v-if="item.hasChildren"
          :is-expanded="item.isExpanded"
          :class="getItemOpacityClass()"
          @click="toggleExpansion()"
        />
        <div v-else class="w-4 shrink-0"></div>

        <!-- Item content -->
        <div
          class="flex flex-col min-w-0"
          :class="[getItemTextColorClass(), getItemOpacityClass()]"
        >
          <div class="truncate text-body-2xs">
            {{ getTreeItemHeader() }}
          </div>
          <div class="truncate text-body-3xs text-foreground-2">
            {{ getTreeItemSubheader() }}
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div
        class="flex items-center group-hover:w-auto overflow-hidden shrink-0"
        :class="isTreeItemHidden || isTreeItemIsolated ? 'w-auto' : 'w-0'"
      >
        <ViewerVisibilityButton
          :is-hidden="isTreeItemHidden"
          @click="toggleTreeItemVisibility()"
        />
        <ViewerIsolateButton
          :is-isolated="isTreeItemIsolated"
          @click="toggleTreeItemIsolation()"
        />
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ExplorerNode } from '~~/lib/viewer/helpers/sceneExplorer'
import { containsAll } from '~~/lib/common/helpers/utils'
import {
  getTargetObjectIds,
  getHeaderAndSubheaderForSpeckleObject
} from '~~/lib/object-sidebar/helpers'
import {
  useSelectionUtilities,
  useFilterUtilities,
  useHighlightedObjectsUtilities
} from '~~/lib/viewer/composables/ui'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import type { UnifiedVirtualItem } from '~~/lib/viewer/composables/tree'

const props = defineProps<{
  item: UnifiedVirtualItem
}>()

const emit = defineEmits<{
  'toggle-expansion': [itemId: string]
  'item-click': [item: UnifiedVirtualItem, event: MouseEvent | KeyboardEvent]
}>()

const { objects: selectedObjects } = useSelectionUtilities()
const { hideObjects, showObjects, isolateObjects, unIsolateObjects } =
  useFilterUtilities()
const { highlightObjects, unhighlightObjects } = useHighlightedObjectsUtilities()

const {
  viewer: {
    metadata: { filteringState }
  }
} = useInjectedViewerState()

const hiddenObjects = computed(() => filteringState.value?.hiddenObjects)
const isolatedObjects = computed(() => filteringState.value?.isolatedObjects)

const stateHasIsolatedObjectsInGeneral = computed(() => {
  if (!isolatedObjects.value) return false
  return isolatedObjects.value.length > 0
})

const rawSpeckleData = computed(() => {
  if (props.item.type !== 'tree-item') return null
  const node = props.item.data as ExplorerNode
  return node.raw || null
})

const isTreeItemHidden = computed((): boolean => {
  if (!rawSpeckleData.value || !hiddenObjects.value) return false
  const ids = getTargetObjectIds(rawSpeckleData.value)
  return containsAll(ids, hiddenObjects.value)
})

const isTreeItemIsolated = computed((): boolean => {
  if (!rawSpeckleData.value || !isolatedObjects.value) return false
  const ids = getTargetObjectIds(rawSpeckleData.value)
  return containsAll(ids, isolatedObjects.value)
})

const toggleTreeItemVisibility = () => {
  if (!rawSpeckleData.value) return
  const ids = getTargetObjectIds(rawSpeckleData.value)

  if (!isTreeItemHidden.value) {
    hideObjects(ids)
  } else {
    showObjects(ids)
  }
}

const toggleTreeItemIsolation = () => {
  if (!rawSpeckleData.value) return
  const ids = getTargetObjectIds(rawSpeckleData.value)

  if (!isTreeItemIsolated.value) {
    isolateObjects(ids)
  } else {
    unIsolateObjects(ids)
  }
}

const toggleExpansion = () => {
  emit('toggle-expansion', props.item.id)
}

const handleItemClick = (event: MouseEvent | KeyboardEvent) => {
  emit('item-click', props.item, event)
}

const handleItemMouseEnter = () => {
  if (!rawSpeckleData.value) return
  highlightObjects(getTargetObjectIds(rawSpeckleData.value))
}

const handleItemMouseLeave = () => {
  if (!rawSpeckleData.value) return
  unhighlightObjects(getTargetObjectIds(rawSpeckleData.value))
}

const getItemBackgroundClass = (): string => {
  if (props.item.type !== 'tree-item') return ''

  const node = props.item.data as ExplorerNode
  const speckleData = node.raw
  if (!speckleData?.id) return ''

  const isSelected = selectedObjects.value.find((o) => o.id === speckleData.id)
  const isChildOfSelected = props.item.isDescendantOfSelected

  if (isSelected) return 'bg-highlight-3 rounded-sm'
  if (isChildOfSelected) return 'bg-foundation-2 hover:bg-highlight-3'
  return 'bg-foundation hover:bg-highlight-1 hover:rounded-sm'
}

const getItemOpacityClass = (): string => {
  if (!rawSpeckleData.value) return ''

  const isHidden = isTreeItemHidden.value
  const isIsolated = isTreeItemIsolated.value

  if (isHidden || (!isIsolated && stateHasIsolatedObjectsInGeneral.value)) {
    return 'opacity-60'
  }
  return ''
}

const getItemTextColorClass = (): string => {
  if (!rawSpeckleData.value) return ''

  const isHidden = isTreeItemHidden.value
  const isIsolated = isTreeItemIsolated.value

  if (isHidden || (!isIsolated && stateHasIsolatedObjectsInGeneral.value)) {
    return 'text-foreground-2'
  }
  return ''
}

const getTreeItemHeader = (): string => {
  if (props.item.type !== 'tree-item') return ''

  const node = props.item.data as ExplorerNode
  const speckleData = node.raw
  if (!speckleData) return ''

  const { header } = getHeaderAndSubheaderForSpeckleObject(speckleData)
  return header
}

const getTreeItemSubheader = (): string => {
  if (props.item.type !== 'tree-item') return ''

  const node = props.item.data as ExplorerNode
  const speckleData = node.raw
  if (!speckleData) return ''

  const { subheader } = getHeaderAndSubheaderForSpeckleObject(speckleData)
  return subheader
}
</script>
