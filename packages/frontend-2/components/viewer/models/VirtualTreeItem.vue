<template>
  <div class="px-1">
    <button
      type="button"
      class="flex items-center justify-between w-full p-1 cursor-pointer text-left"
      :class="[getItemBackgroundClass(), getItemOpacityClass()]"
      @click="handleItemClick($event)"
      @mouseenter="handleItemMouseEnter()"
      @mouseleave="handleItemMouseLeave()"
      @focusin="handleItemMouseEnter()"
      @focusout="handleItemMouseLeave()"
    >
      <!-- Indentation -->
      <div class="flex items-center gap-0.5 min-w-0">
        <div
          :style="{ width: `${(item.indent || 0) * 0.375}rem` }"
          class="shrink-0"
        ></div>

        <!-- Triangle button -->
        <FormButton
          v-if="item.hasChildren"
          size="sm"
          color="subtle"
          :class="getItemOpacityClass()"
          @click.stop="$emit('toggle-expansion', item.id)"
        >
          <IconTriangle
            class="w-4 h-4 -ml-1.5 -mr-1.5 text-foreground-2"
            :class="item.isExpanded ? 'rotate-90' : ''"
          />
        </FormButton>
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
        :class="isTreeItemHidden() || isTreeItemIsolated() ? 'w-auto' : 'w-0'"
      >
        <button
          class="p-1 rounded-md hover:bg-highlight-3"
          :class="
            isTreeItemHidden() ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          "
          @click.stop="toggleTreeItemVisibility()"
        >
          <IconEyeClosed v-if="isTreeItemHidden()" class="w-4 h-4" />
          <IconEye v-else class="w-4 h-4" />
        </button>
        <button
          class="p-1 rounded-md"
          :class="
            isTreeItemIsolated()
              ? 'opacity-100 hover:bg-highlight-1'
              : 'opacity-0 group-hover:opacity-100 hover:bg-highlight-3'
          "
          @click.stop="toggleTreeItemIsolation()"
        >
          <IconViewerUnisolate v-if="isTreeItemIsolated()" class="w-3.5 h-3.5" />
          <IconViewerIsolate v-else class="w-3.5 h-3.5" />
        </button>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ExplorerNode } from '~~/lib/viewer/helpers/sceneExplorer'
import type { ViewerLoadedResourcesQuery } from '~~/lib/common/generated/gql/graphql'
import type { Get } from 'type-fest'
import { containsAll } from '~~/lib/common/helpers/utils'
import {
  getTargetObjectIds,
  getHeaderAndSubheaderForSpeckleObject
} from '~~/lib/object-sidebar/helpers'
import { useSelectionUtilities, useFilterUtilities } from '~~/lib/viewer/composables/ui'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'

type ModelItem = NonNullable<Get<ViewerLoadedResourcesQuery, 'project.models.items[0]'>>

interface UnifiedVirtualItem {
  type: 'model-header' | 'tree-item'
  id: string
  modelId: string
  data: ExplorerNode | { model: ModelItem; versionId: string }
  indent?: number
  hasChildren?: boolean
  isExpanded?: boolean
  isDescendantOfSelected?: boolean
}

const props = defineProps<{
  item: UnifiedVirtualItem
}>()

const emit = defineEmits<{
  'toggle-expansion': [itemId: string]
  'item-click': [item: UnifiedVirtualItem, event: MouseEvent | KeyboardEvent]
  'mouse-enter': [item: UnifiedVirtualItem]
  'mouse-leave': [item: UnifiedVirtualItem]
}>()

const { objects: selectedObjects } = useSelectionUtilities()
const { hideObjects, showObjects, isolateObjects, unIsolateObjects } =
  useFilterUtilities()
const {
  viewer: {
    metadata: { filteringState }
  }
} = useInjectedViewerState()

const isolatedObjects = computed(() => filteringState.value?.isolatedObjectIds)

const handleItemClick = (event: MouseEvent | KeyboardEvent) => {
  emit('item-click', props.item, event)
}

const handleItemMouseEnter = () => {
  emit('mouse-enter', props.item)
}

const handleItemMouseLeave = () => {
  emit('mouse-leave', props.item)
}

const toggleTreeItemVisibility = () => {
  if (props.item.type !== 'tree-item') return

  const node = props.item.data as ExplorerNode
  const speckleData = node.raw
  if (!speckleData?.id) return

  const ids = getTargetObjectIds(speckleData)

  if (isTreeItemHidden()) {
    showObjects(ids)
  } else {
    hideObjects(ids)
  }
}

const toggleTreeItemIsolation = () => {
  if (props.item.type !== 'tree-item') return

  const node = props.item.data as ExplorerNode
  const speckleData = node.raw
  if (!speckleData?.id) return

  const ids = getTargetObjectIds(speckleData)

  if (isTreeItemIsolated()) {
    unIsolateObjects(ids)
  } else {
    isolateObjects(ids)
  }
}

const isTreeItemHidden = (): boolean => {
  if (props.item.type !== 'tree-item') return false

  const node = props.item.data as ExplorerNode
  const speckleData = node.raw
  if (!speckleData?.id) return false

  const hiddenObjects = filteringState.value?.hiddenObjectIds
  if (!hiddenObjects) return false

  const ids = getTargetObjectIds(speckleData)
  return containsAll(ids, hiddenObjects)
}

const isTreeItemIsolated = (): boolean => {
  if (props.item.type !== 'tree-item') return false

  const node = props.item.data as ExplorerNode
  const speckleData = node.raw
  if (!speckleData?.id) return false

  const isolatedObjects = filteringState.value?.isolatedObjectIds
  if (!isolatedObjects) return false

  const ids = getTargetObjectIds(speckleData)
  return containsAll(ids, isolatedObjects)
}

const getItemBackgroundClass = (): string => {
  if (props.item.type !== 'tree-item') return ''

  const node = props.item.data as ExplorerNode
  const speckleData = node.raw
  if (!speckleData?.id) return ''

  const isSelected = selectedObjects.value.find((o) => o.id === speckleData.id)
  const isChildOfSelected = props.item.isDescendantOfSelected

  if (isSelected) return 'bg-highlight-3 rounded-sm'
  if (isChildOfSelected) return 'bg-foundation-2'
  return 'bg-foundation hover:bg-highlight-1 hover:rounded-sm'
}

const getItemOpacityClass = (): string => {
  if (props.item.type !== 'tree-item') return ''

  const node = props.item.data as ExplorerNode
  const speckleData = node.raw
  if (!speckleData?.id) return ''

  const isHidden = isTreeItemHidden()
  const isIsolated = isTreeItemIsolated()
  const stateHasIsolatedObjectsInGeneral =
    isolatedObjects.value && isolatedObjects.value.length > 0

  if (isHidden || (!isIsolated && stateHasIsolatedObjectsInGeneral)) {
    return 'opacity-60'
  }
  return ''
}

const getItemTextColorClass = (): string => {
  if (props.item.type !== 'tree-item') return ''

  const node = props.item.data as ExplorerNode
  const speckleData = node.raw
  if (!speckleData?.id) return ''

  const isHidden = isTreeItemHidden()
  const isIsolated = isTreeItemIsolated()
  const stateHasIsolatedObjectsInGeneral =
    isolatedObjects.value && isolatedObjects.value.length > 0

  if (isHidden || (!isIsolated && stateHasIsolatedObjectsInGeneral)) {
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
