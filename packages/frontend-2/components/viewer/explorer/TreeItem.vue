<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div class="w-full select-none">
    <!-- Header -->
    <div class="bg-foundation w-full rounded-md py-1 px-1">
      <div class="flex w-full items-stretch space-x-1">
        <!-- Unfold button -->
        <div class="flex w-5 flex-shrink-0 justify-center overflow-hidden">
          <button
            v-if="isSingleCollection || isMultipleCollection"
            class="hover:bg-foundation-2 hover:text-primary flex h-full w-full items-center justify-center rounded"
            @click="manualUnfoldToggle()"
          >
            <ChevronDownIcon
              :class="`h-3 w-3 ${!unfold ? '-rotate-90' : 'rotate-0'} ${
                isSelected ? 'text-primary' : ''
              }`"
            />
          </button>
        </div>
        <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
        <div
          :class="`hover:bg-foundation-2 group flex flex-grow cursor-pointer items-center space-x-1 overflow-hidden rounded border-l-4 pl-2 pr-1
            ${isSelected ? 'border-primary bg-foundation-2' : 'border-transparent'}
          `"
          @click="(e:MouseEvent) => setSelection(e)"
          @mouseenter="highlightObject"
          @focusin="highlightObject"
          @mouseleave="unhighlightObject"
          @focusout="unhighlightObject"
        >
          <div
            :class="`truncate ${
              isHidden || (!isIsolated && stateHasIsolatedObjectsInGeneral)
                ? 'text-foreground-2'
                : ''
            }`"
          >
            <div :class="`truncate text-body-xs ${unfold ? 'font-medium' : ''}`">
              <!-- Note, enforce header from parent if provided (used in the case of root nodes) -->
              {{ header || headerAndSubheader.header }}
            </div>
            <div class="text-body-3xs text-foreground-2 truncate -mt-0.5">
              {{ subHeader || headerAndSubheader.subheader }}
            </div>
            <div v-if="debug" class="text-tiny text-foreground-2">
              unfold: {{ unfold }} / selected: {{ isSelected }} / hidden:
              {{ isHidden }} / isolated:
              {{ isIsolated }}
            </div>
          </div>
          <div class="flex-grow"></div>
          <div class="flex flex-shrink-0 items-center space-x-1">
            <!-- <div v-if="!(isSingleCollection || isMultipleCollection)"> -->
            <div class="flex space-x-2">
              <button
                :class="`hover:text-primary px-1 py-2 opacity-0 group-hover:opacity-100 ${
                  isHidden ? 'opacity-100' : ''
                }`"
                @click.stop="hideOrShowObject"
              >
                <EyeIcon v-if="!isHidden" class="h-3 w-3" />
                <EyeSlashIcon v-else class="h-3 w-3" />
              </button>
              <button
                :class="`hover:text-primary px-1 py-2 opacity-0 group-hover:opacity-100 ${
                  isIsolated ? 'opacity-100' : ''
                }`"
                @click.stop="isolateOrUnisolateObject"
              >
                <FunnelIconOutline v-if="!isIsolated" class="h-3 w-3" />
                <FunnelIcon v-else class="h-3 w-3" />
              </button>
            </div>
            <div
              v-if="
                (isSingleCollection || isMultipleCollection) &&
                typeof childrenLength === 'number'
              "
            >
              <span class="text-foreground-2 text-xs">({{ childrenLength }})</span>
            </div>
          </div>
        </div>
      </div>
      <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
      <div v-if="debug" class="text-foreground-2 text-xs" @click="setSelection">
        single: {{ isSingleCollection }}; multiple: {{ isMultipleCollection }}; a:
        {{ isAtomic }}
      </div>
    </div>

    <!-- Children Contents -->
    <div v-if="unfold" class="relative pl-1 text-xs">
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
            :debug="debug"
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
            :debug="debug"
            :parent="treeItem"
            @expanded="(e) => $emit('expanded', e)"
          />
        </div>
        <div v-if="itemCount <= singleCollectionItems.length" class="mb-2">
          <FormButton size="sm" text full-width @click="itemCount += pageSize">
            View More ({{ singleCollectionItems.length - itemCount }})
          </FormButton>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  ChevronDownIcon,
  EyeIcon,
  EyeSlashIcon,
  FunnelIcon
} from '@heroicons/vue/24/solid'
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

const props = withDefaults(
  defineProps<{
    treeItem: TreeItemComponentModel
    parent?: TreeItemComponentModel
    depth?: number
    debug?: boolean
    expandLevel: number
    manualExpandLevel: number
    header?: string | null
    subHeader?: string | null
  }>(),
  { depth: 0, debug: false, header: null, subHeader: null }
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

const childrenLength = computed(() => {
  if (rawSpeckleData.value.elements && Array.isArray(rawSpeckleData.value.elements))
    return rawSpeckleData.value.elements.length
  if (rawSpeckleData.value.children && Array.isArray(rawSpeckleData.value.children))
    return rawSpeckleData.value.children.length
  return 0
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
