<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div :class="{ 'opacity-60': shouldShowDimmed }">
    <!-- Header -->
    <div
      ref="headerElement"
      class="group flex items-center justify-between w-full p-1 cursor-pointer"
      :class="getBackgroundClass"
      @click.stop="(e:MouseEvent) => setSelection(e)"
      @mouseenter="highlightObject"
      @focusin="highlightObject"
      @mouseleave="unhighlightObject"
      @focusout="unhighlightObject"
    >
      <div class="flex items-center gap-0.5 min-w-0">
        <div :style="{ width: `${depth * 0.375}rem` }" class="shrink-0"></div>
        <FormButton
          v-if="isSingleCollection || isMultipleCollection"
          size="sm"
          color="subtle"
          @click.stop="manualUnfoldToggle"
        >
          <IconTriangle
            class="w-4 h-4 -ml-1.5 -mr-1.5 text-foreground-2"
            :class="unfold ? 'rotate-90' : ''"
          />
          <span class="sr-only">
            {{ unfold ? 'Collapse' : 'Expand' }}
          </span>
        </FormButton>
        <div v-else class="w-4 shrink-0"></div>
        <div
          class="flex flex-col min-w-0"
          :class="
            isHidden || (!isIsolated && stateHasIsolatedObjectsInGeneral)
              ? 'text-foreground-2'
              : ''
          "
        >
          <div class="truncate text-body-2xs">
            <!-- Note, enforce header from parent if provided (used in the case of root nodes) -->
            {{ header || headerAndSubheader.header }}
          </div>
          <div class="truncate text-body-3xs text-foreground-2">
            {{ subHeader || headerAndSubheader.subheader }}
          </div>
        </div>
      </div>

      <div class="flex items-center w-0 group-hover:w-auto overflow-hidden shrink-0">
        <button
          v-tippy="getTooltipProps(isHidden ? 'Show' : 'Hide', { placement: 'top' })"
          class="p-1 rounded-md"
          :icon-left="isHidden ? IconEyeClosed : IconEye"
          :class="
            isHidden || isSelected
              ? 'opacity-100 hover:bg-highlight-1'
              : 'opacity-0 group-hover:opacity-100 hover:bg-highlight-3'
          "
          @click.stop="hideOrShowObject"
        >
          <IconEyeClosed v-if="isHidden" class="w-4 h-4" />
          <IconEye v-else class="w-4 h-4" />
        </button>
        <button
          v-tippy="
            getTooltipProps(isIsolated ? 'Unisolate' : 'Isolate', { placement: 'top' })
          "
          class="p-1 rounded-md"
          :class="
            isIsolated || isSelected
              ? 'opacity-100 hover:bg-highlight-1'
              : 'opacity-0 group-hover:opacity-100 hover:bg-highlight-3'
          "
          @click.stop="isolateOrUnisolateObject"
        >
          <IconViewerUnisolate v-if="isIsolated" class="w-3.5 h-3.5" />
          <IconViewerIsolate v-else class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Children contents -->
    <div v-if="unfold" class="bg-foundation-2">
      <!-- If we have array collections -->
      <div v-if="isMultipleCollection">
        <!-- mul col items -->
        <div
          v-for="(item, idx) in arrayCollections"
          :key="item?.rawNode.raw?.name || idx"
        >
          <TreeItem
            :item-id="(item.rawNode.raw?.id as string)"
            :tree-item="item"
            :depth="depth + 1"
            :expand-level="props.expandLevel"
            :manual-expand-level="manualExpandLevel"
            :parent="treeItem"
            :is-descendant-of-selected="isSelected || isChildOfSelected"
            @expanded="(e) => $emit('expanded', e)"
          />
        </div>
      </div>
      <!-- If we have a single model collection -->
      <div v-if="isSingleCollection">
        <!-- single col items -->
        <div
          v-for="(item, idx) in singleCollectionItemsPaginated"
          :key="item.rawNode.raw?.id || idx"
        >
          <TreeItem
            :item-id="(item.rawNode.raw?.id as string)"
            :tree-item="item"
            :depth="depth + 1"
            :expand-level="props.expandLevel"
            :manual-expand-level="manualExpandLevel"
            :force-expanded-node-ids="props.forceExpandedNodeIds"
            :parent="treeItem"
            :is-descendant-of-selected="isSelected || isChildOfSelected"
            @expanded="(e) => $emit('expanded', e)"
          />
        </div>
        <div v-if="itemCount < singleCollectionItems.length">
          <FormButton
            size="sm"
            color="outline"
            text
            full-width
            @click="itemCount += pageSize"
          >
            View more ({{ singleCollectionItems.length - itemCount }})
          </FormButton>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type {
  ExplorerNode,
  SpeckleObject,
  SpeckleReference,
  TreeItemComponentModel
} from '~~/lib/viewer/helpers/sceneExplorer'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import {
  getHeaderAndSubheaderForSpeckleObject,
  getTargetObjectIds
} from '~~/lib/object-sidebar/helpers'
import { containsAll } from '~~/lib/common/helpers/utils'
import {
  useFilterUtilities,
  useHighlightedObjectsUtilities,
  useSelectionUtilities
} from '~~/lib/viewer/composables/ui'

const IconEye = resolveComponent('IconEye')
const IconEyeClosed = resolveComponent('IconEyeClosed')

const props = withDefaults(
  defineProps<{
    treeItem: TreeItemComponentModel
    parent?: TreeItemComponentModel
    depth?: number
    expandLevel: number
    manualExpandLevel: number
    header?: string | null
    subHeader?: string | null
    isDescendantOfSelected?: boolean
    forceExpandedNodeIds?: Set<string>
  }>(),
  { depth: 0, header: null, subHeader: null, isDescendantOfSelected: false }
)

const emit = defineEmits<{
  (e: 'expanded', depth: number): void
}>()

const {
  viewer: {
    metadata: { filteringState }
  }
} = useInjectedViewerState()
const { addToSelection, clearSelection, removeFromSelection, objects } =
  useSelectionUtilities()
const { hideObjects, showObjects, isolateObjects, unIsolateObjects } =
  useFilterUtilities()
const { highlightObjects, unhighlightObjects } = useHighlightedObjectsUtilities()
const { getTooltipProps } = useSmartTooltipDelay()

const isAtomic = computed(() => props.treeItem.rawNode.atomic === true)
const rawSpeckleData = computed(() => props.treeItem?.rawNode.raw as SpeckleObject)
const speckleData = rawSpeckleData

function getNestedModelHeader(name: string): string {
  const parts = name.split('/')
  return parts.length > 1 ? (parts.pop() as string) : name
}

const headerAndSubheader = computed(() => {
  const { header, subheader } = getHeaderAndSubheaderForSpeckleObject(
    rawSpeckleData.value
  )
  return {
    header: getNestedModelHeader(header),
    subheader
  }
})

const isSingleCollection = computed(() => {
  return (
    isNonEmptyObjectArray(speckleData.value.children) ||
    isNonEmptyObjectArray(speckleData.value.elements)
  )
})

const singleCollectionItems = computed(() => {
  const treeItems = props.treeItem.rawNode.children.filter(
    (child) => !!child.raw?.id && isAllowedType(child)
    // filter out random tree children (no id means they're not actual objects)
  )
  // Handle the case of a wall, roof or other atomic objects that have nested children
  if (isNonEmptyObjectArray(speckleData.value.elements) && isAtomic.value) {
    // We need to filter out children that are not direct descendants of `elements`
    // Note: this is a current assumption convention.
    const ids = (speckleData.value.elements as SpeckleReference[]).map(
      (obj) => obj.referencedId
    )
    return treeItems
      .filter((item) => ids.includes(item.raw?.id as string))
      .map(
        (i): TreeItemComponentModel => ({
          rawNode: i
        })
      )
  }
  return treeItems.map(
    (i): TreeItemComponentModel => ({
      rawNode: i
    })
  )
})

const itemCount = ref(10)
const pageSize = 10
const singleCollectionItemsPaginated = computed(() => {
  return singleCollectionItems.value.slice(0, itemCount.value)
})

// Creates a list of all model collections that are not defined as collections. specifically, handles cases such as
// object { @boat: [obj, obj, obj], @harbour: [obj, obj, obj], etc. }
// @boat and @harbour would ideally be model collections, but, alas, connectors don't have that yet.
const arrayCollections = computed(() => {
  const arr = [] as TreeItemComponentModel[]
  for (const k of Object.keys(rawSpeckleData)) {
    if (k === 'children' || k === 'elements' || k.includes('displayValue')) continue

    const val = rawSpeckleData.value[k] as SpeckleReference[]
    if (!isNonEmptyObjectArray(val)) continue

    const ids = val.map((ref) => ref.referencedId) // NOTE: we're assuming all collections have refs inside; might revisit/to think re edge cases

    const actualRawRefs = props.treeItem.rawNode.children.filter(
      (node) => ids.includes(node.raw?.id as string) && isAllowedType(node)
    )

    if (actualRawRefs.length === 0) continue // bypasses chunks: if the actual object is not part of the tree item's children, it means it's a sublimated type (ie, a chunk). the assumption we're making is that any list of actual atomic objects is not chunked.
    const modelCollectionItem = {
      raw: {
        name: k,
        id: k,
        // eslint-disable-next-line camelcase
        speckle_type: 'Array Collection',
        children: val //actualRawRefs.map((ref) => ref.raw) as SpeckleObject[]
      },
      children: actualRawRefs,
      expanded: false
    }
    arr.push({
      rawNode: modelCollectionItem
    })
  }

  return arr
})

const isMultipleCollection = computed(() => arrayCollections.value.length > 0)

const isNonEmptyArray = (x: unknown): x is Array<unknown> =>
  !!x && Array.isArray(x) && x.length > 0

const isNonEmptyObjectArray = (x: unknown) => isNonEmptyArray(x) && isObject(x[0])

const isObject = (x: unknown) =>
  typeof x === 'object' && !Array.isArray(x) && x !== null

const hiddenSpeckleTypes = [
  'Objects.Other', // From a fast look at the current object model, and the new one, all of this can be safely ignored (partially be ready for complaints)
  // 'Objects.Other.DisplayStyle',
  // 'Objects.Other.Revit.RevitMaterial',
  'ColorProxy',
  'InstanceDefinitionProxy', // Note, but not InstanceProxy - wish we could just go for "*Proxy*" but...
  'GroupProxy',
  'RenderMaterialProxy', // It's now partially included in the objects.other namespace, but we might move the class around, so... better safe than sorry!
  'Objects.BuiltElements.Revit.ProjectInfo',
  'Objects.BuiltElements.View',
  'Objects.BuiltElements.View3D'
]

const isAllowedType = (node: ExplorerNode) => {
  const speckleType = node.raw?.speckle_type || ''
  return !hiddenSpeckleTypes.some((substring) => speckleType.includes(substring))
}

const unfold = ref(false)

// Note: we need to emit a manual unfold event with the current depth so we can set it upstream
// for the collapse/unfold functionality
const manualUnfoldToggle = () => {
  unfold.value = !unfold.value
  if (unfold.value) emit('expanded', props.depth)
}

const isSelected = computed(() => {
  return !!objects.value.find((o) => o.id === speckleData.value.id)
})

const isChildOfSelected = computed(() => {
  return (
    props.isDescendantOfSelected ||
    (props.parent &&
      !!objects.value.find((o) => {
        const parentSpeckleData = props.parent!.rawNode.raw as SpeckleObject
        return o.id === parentSpeckleData.id
      }))
  )
})

const getBackgroundClass = computed(() => {
  if (isSelected.value) return 'bg-highlight-3'
  if (isChildOfSelected.value) return 'bg-foundation-2'
  return 'bg-foundation hover:bg-highlight-1'
})

const highlightObject = () => {
  highlightObjects(getTargetObjectIds(rawSpeckleData.value))
}

const unhighlightObject = () => {
  unhighlightObjects(getTargetObjectIds(rawSpeckleData.value))
}

const hiddenObjects = computed(() => filteringState.value?.hiddenObjects)
const isolatedObjects = computed(() => filteringState.value?.isolatedObjects)

const isHidden = computed(() => {
  if (!hiddenObjects.value) return false
  const ids = getTargetObjectIds(rawSpeckleData.value)
  return containsAll(ids, hiddenObjects.value)
})

const stateHasIsolatedObjectsInGeneral = computed(() => {
  if (!isolatedObjects.value) return false
  return isolatedObjects.value.length > 0
})

const isIsolated = computed(() => {
  if (!isolatedObjects.value) return false
  const ids = getTargetObjectIds(rawSpeckleData.value)
  return containsAll(ids, isolatedObjects.value)
})

const shouldShowDimmed = computed(() => {
  return stateHasIsolatedObjectsInGeneral.value && !isIsolated.value
})

const hideOrShowObject = () => {
  const ids = getTargetObjectIds(rawSpeckleData.value)
  if (!isHidden.value) {
    hideObjects(ids)
    return
  }

  showObjects(ids)
}

const isolateOrUnisolateObject = () => {
  const ids = getTargetObjectIds(rawSpeckleData.value)
  if (!isIsolated.value) {
    isolateObjects(ids)
    return
  }

  unIsolateObjects(ids)
}

const setSelection = (e: MouseEvent) => {
  disableScrollOnNextSelection.value = true

  if (isSelected.value && !e.shiftKey) {
    // If already selected, try to expand if possible, but don't deselect
    if ((isSingleCollection.value || isMultipleCollection.value) && !unfold.value) {
      unfold.value = true
      emit('expanded', props.depth)
    }
    disableScrollOnNextSelection.value = false
    return
  }
  if (isSelected.value && e.shiftKey) {
    removeFromSelection(rawSpeckleData.value)
    disableScrollOnNextSelection.value = false
    return
  }
  if (!e.shiftKey) clearSelection()
  addToSelection(rawSpeckleData.value)

  // Auto-expand when selecting if it has children
  if ((isSingleCollection.value || isMultipleCollection.value) && !unfold.value) {
    unfold.value = true
    emit('expanded', props.depth)
  }
}

const ensureSelectedItemsVisible = () => {
  const selectedIds = objects.value.map((obj: { id: string }) => obj.id)
  if (selectedIds.length === 0) return

  // Check if any selected items are in this container but beyond current pagination
  const allItems = singleCollectionItems.value
  const selectedIndices = allItems
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      const itemId = item.rawNode.raw?.id
      return itemId && selectedIds.includes(itemId)
    })
    .map(({ index }) => index)

  if (selectedIndices.length > 0) {
    const maxSelectedIndex = Math.max(...selectedIndices)
    // Ensure itemCount is high enough to show the selected item
    if (maxSelectedIndex >= itemCount.value) {
      itemCount.value = Math.max(maxSelectedIndex + 1, itemCount.value)
    }
  }
}

const checkAndExpand = () => {
  const nodeId = rawSpeckleData.value.id
  const shouldForceExpand = props.forceExpandedNodeIds?.has(nodeId)

  if (
    (isSingleCollection.value || isMultipleCollection.value) &&
    (props.expandLevel >= props.depth || shouldForceExpand)
  ) {
    unfold.value = true
    ensureSelectedItemsVisible()
  }
}

const headerElement = ref<HTMLElement>()
const disableScrollOnNextSelection = ref(false)

onMounted(() => {
  checkAndExpand()

  const nodeId = rawSpeckleData.value.id
  const isForceExpanded = props.forceExpandedNodeIds?.has(nodeId)

  if (
    isSelected.value &&
    isForceExpanded &&
    headerElement.value &&
    !disableScrollOnNextSelection.value
  ) {
    headerElement.value.scrollIntoView({
      behavior: 'instant',
      block: 'center'
    })
  }

  disableScrollOnNextSelection.value = false
})

watch(
  () => props.forceExpandedNodeIds,
  () => {
    checkAndExpand()
  },
  { deep: true }
)

watch(
  () => isSelected.value,
  (newIsSelected, oldIsSelected) => {
    if (newIsSelected && !oldIsSelected) {
      const nodeId = rawSpeckleData.value.id
      const isForceExpanded = props.forceExpandedNodeIds?.has(nodeId)

      if (
        isForceExpanded &&
        headerElement.value &&
        !disableScrollOnNextSelection.value
      ) {
        headerElement.value.scrollIntoView({
          behavior: 'instant',
          block: 'center'
        })
      }

      disableScrollOnNextSelection.value = false
    }
  }
)
</script>
