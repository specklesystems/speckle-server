<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div>
    <!-- Header -->
    <div
      class="group flex items-center justify-between w-full p-2 pr-1 cursor-pointer"
      :class="[
        unfold && !isSelected ? 'bg-foundation-2' : '',
        isSelected ? 'bg-highlight-3' : 'hover:bg-highlight-1'
      ]"
      @click.stop="(e:MouseEvent) => setSelection(e)"
      @mouseenter="highlightObject"
      @focusin="highlightObject"
      @mouseleave="unhighlightObject"
      @focusout="unhighlightObject"
    >
      <div class="flex items-center gap-0.5">
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
          class="flex flex-col"
          :class="
            isHidden || (!isIsolated && stateHasIsolatedObjectsInGeneral)
              ? 'text-foreground-2'
              : ''
          "
        >
          <div class="flex truncate text-body-2xs">
            <!-- Note, enforce header from parent if provided (used in the case of root nodes) -->
            {{ header || headerAndSubheader.header }}
          </div>
          <div class="flex text-body-3xs text-foreground-2 truncate">
            {{ subHeader || headerAndSubheader.subheader }}
          </div>
        </div>
      </div>

      <div class="flex items-center">
        <FormButton
          color="subtle"
          hide-text
          :icon-left="isHidden ? IconEyeClosed : IconEye"
          :class="
            isHidden || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          "
          @click.stop="hideOrShowObject"
        >
          {{ isHidden ? 'Show' : 'Hide' }}
        </FormButton>
        <FormButton
          color="subtle"
          hide-text
          :icon-left="isIsolated ? FunnelIcon : FunnelIconOutline"
          :class="
            isIsolated || isSelected
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100'
          "
          @click.stop="isolateOrUnisolateObject"
        >
          {{ isIsolated ? 'Unisolate' : 'Isolate' }}
        </FormButton>
      </div>
    </div>

    <!-- Children contents -->
    <div v-if="unfold" class="pl-1.5 bg-foundation-2">
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
            :parent="treeItem"
            @expanded="(e) => $emit('expanded', e)"
          />
        </div>
        <div v-if="itemCount <= singleCollectionItems.length" class="mb-2">
          <FormButton size="sm" text full-width @click="itemCount += pageSize">
            View more ({{ singleCollectionItems.length - itemCount }})
          </FormButton>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { FunnelIcon } from '@heroicons/vue/24/solid'
import { FunnelIcon as FunnelIconOutline } from '@heroicons/vue/24/outline'
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
  }>(),
  { depth: 0, header: null, subHeader: null }
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

// NOTE: not happy with how unfolding and collapsing panned out :(
// it works, but requiring two different props... phew.
watch(
  () => props.expandLevel,
  (newVal) => {
    if (isSingleCollection.value || isMultipleCollection.value) {
      unfold.value = newVal >= props.depth
    }
    // if (newVal > oldVal) unfold.value = true
    // else if (newVal <= props.depth) unfold.value = false
  }
)

watch(
  () => props.manualExpandLevel,
  (newVal, oldVal) => {
    if (!(isSingleCollection.value || isMultipleCollection.value)) return
    if (
      newVal < oldVal &&
      unfold.value &&
      (isSingleCollection.value || isMultipleCollection.value) &&
      props.depth > newVal
    )
      unfold.value = false
  }
)

// Note: we need to emit a manual unfold event with the current depth so we can set it upstream
// for the collapse/unfold functionality
const manualUnfoldToggle = () => {
  unfold.value = !unfold.value
  if (unfold.value) emit('expanded', props.depth)
}

const isSelected = computed(() => {
  return !!objects.value.find((o) => o.id === speckleData.value.id)
})

const setSelection = (e: MouseEvent) => {
  if (isSelected.value && !e.shiftKey) {
    clearSelection()
    return
  }
  if (isSelected.value && e.shiftKey) {
    removeFromSelection(rawSpeckleData.value)
    return
  }
  if (!e.shiftKey) clearSelection()
  addToSelection(rawSpeckleData.value)
}

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
</script>
