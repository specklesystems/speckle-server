<template>
  <!--     -->
  <!-- WIP -->
  <!--     -->
  <div class="w-full select-none">
    <!-- Header -->
    <div class="bg-foundation py-1 rounded-md px-1 w-full">
      <div class="flex items-stretch space-x-1 w-full">
        <!-- Unfold button -->
        <div class="w-6 overflow-hidden flex-shrink-0">
          <button
            v-if="isSingleCollection || isMultipleCollection"
            class="h-full px-1 hover:bg-primary-muted hover:text-primary rounded flex items-center justify-center"
            @click="unfold = !unfold"
          >
            <ChevronDownIcon
              :class="`w-4 h-4 transition ${!unfold ? '-rotate-90' : 'rotate-0'}`"
            />
          </button>
        </div>
        <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
        <div
          :class="`group flex items-center space-x-1 overflow-hidden flex-grow hover:bg-foundation-focus cursor-pointer rounded-md px-1
            ${isSelected ? 'ring-1' : 'ring-0'}
          `"
          @click="(e) => setSelection(e)"
        >
          <div :class="`truncate ${unfold ? 'font-semibold' : ''}`">
            <div class="text-sm truncate">
              <!-- Note, enforce header from parent if provided (used in the case of root nodes) -->
              {{ header || headerAndSubheader.header }}
            </div>
            <div class="text-tiny text-foreground-2 truncate">
              {{ subHeader || headerAndSubheader.subheader }}
              <span v-if="debug">/ selected: {{ isSelected }}</span>
            </div>
          </div>
          <div class="flex-grow"></div>
          <div class="flex items-center space-x-1 flex-shrink-0">
            <!-- <div v-if="!(isSingleCollection || isMultipleCollection)"> -->
            <div class="flex space-x-1 transition opacity-0 group-hover:opacity-100">
              <EyeIcon class="w-3 h-3" />
              <FunnelIcon class="w-3 h-3" />
            </div>
            <div v-if="isSingleCollection || isMultipleCollection">
              <span class="text-foreground-2 text-xs">({{ childrenLength }})</span>
            </div>
          </div>
        </div>
      </div>
      <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
      <div v-if="debug" class="text-xs text-foreground-2" @click="setSelection">
        single: {{ isSingleCollection }}; multiple: {{ isMultipleCollection }}; a:
        {{ isAtomic }}
      </div>
    </div>

    <!-- Children Contents -->
    <div v-if="unfold" class="relative pl-1 text-xs">
      <!-- If we have array collections -->
      <div v-if="isMultipleCollection">
        <!-- mul col items -->
        <div v-for="collection in arrayCollections" :key="collection.raw.name">
          <TreeItemOption3
            :item-id="(collection.raw.id as string)"
            :tree-item="collection"
            :depth="depth + 1"
            :debug="debug"
          />
        </div>
      </div>
      <!-- If we have a single model collection -->
      <div v-if="isSingleCollection">
        <!-- single col items -->
        <div v-for="item in singleCollectionItems" :key="item.raw?.id">
          <TreeItemOption3
            :item-id="(item.raw?.id as string)"
            :tree-item="item"
            :depth="depth + 1"
            :debug="debug"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ChevronDownIcon, EyeIcon, FunnelIcon } from '@heroicons/vue/24/solid'
import { Ref } from 'vue'
import {
  ExplorerNode,
  SpeckleObject,
  SpeckleReference
} from '~~/lib/common/helpers/sceneExplorer'
import { useInjectedViewerInterfaceState } from '~~/lib/viewer/composables/setup'
import { getHeaderAndSubheaderForSpeckleObject } from '~~/lib/object-sidebar/helpers'

const props = withDefaults(
  defineProps<{
    itemId: string
    treeItem: ExplorerNode
    depth: number
    debug?: boolean
    forceUnfold?: boolean
    header?: string | null
    subHeader?: string | null
  }>(),
  { depth: 1, debug: false, forceUnfold: false, header: null, subHeader: null }
)

const unfold = ref(props.forceUnfold)

const isAtomic = computed(() => props.treeItem.atomic === true)
const speckleData = props.treeItem?.raw as SpeckleObject
const rawSpeckleData = props.treeItem?.raw as Record<string, unknown>

const headerAndSubheader = computed(() => {
  return getHeaderAndSubheaderForSpeckleObject(rawSpeckleData)
})

const childrenLength = computed(() => {
  if (rawSpeckleData.elements && Array.isArray(rawSpeckleData.elements))
    return rawSpeckleData.elements.length
  if (rawSpeckleData.children && Array.isArray(rawSpeckleData.children))
    return rawSpeckleData.children.length
})

const isSingleCollection = computed(() => {
  return (
    isNonEmptyObjectArray(speckleData.children) ||
    isNonEmptyObjectArray(speckleData.elements)
  )
})

const singleCollectionItems = computed(() => {
  const treeItems = props.treeItem.children.filter((child) => !!child.raw?.id) // filter out random tree children (no id means they're not actual objects)
  // Handle the case of a wall, roof or other atomic objects that have nested children
  if (isNonEmptyObjectArray(speckleData.elements) && isAtomic.value) {
    // We need to filter out children that are not direct descendants of `elements`
    // Note: this is a current assumption convention.
    const ids = (speckleData.elements as SpeckleReference[]).map(
      (obj) => obj.referencedId
    )
    return treeItems.filter((item) => ids.includes(item.raw?.id as string))
  }
  return treeItems
})

const isSingleCollectionItemsIds = computed(() => {
  singleCollectionItems.value.map((obj) => obj.raw?.id as string).filter((id) => !!id)
})

// Creates a list of all model collections that are not defined as collections. specifically, handles cases such as
// object { @boat: [obj, obj, obj], @harbour: [obj, obj, obj], etc. }
// @boat and @harbour would ideally be model collections, but, alas, connectors don't have that yet.
const arrayCollections = computed(() => {
  const arr = [] as ExplorerNode[]
  for (const k of Object.keys(rawSpeckleData)) {
    if (k === 'children' || k === 'elements' || k.includes('displayValue')) continue

    const val = rawSpeckleData[k] as SpeckleReference[]
    if (!isNonEmptyObjectArray(val)) continue

    const ids = val.map((ref) => ref.referencedId) // NOTE: we're assuming all collections have refs inside; might revisit/to think re edge cases

    const actualRawRefs = props.treeItem.children.filter((node) =>
      ids.includes(node.raw?.id as string)
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
      children: actualRawRefs
    }
    arr.push(modelCollectionItem)
  }

  return arr
})

const isMultipleCollection = computed(() => arrayCollections.value.length > 0)

const isNonEmptyArray = (x: unknown) => !!x && Array.isArray(x) && x.length > 0

const isNonEmptyObjectArray = (x: unknown) => isNonEmptyArray(x) && isObject(x[0])

const isObject = (x: unknown) =>
  typeof x === 'object' && !Array.isArray(x) && x !== null

const {
  selection: { addToSelection, clearSelection, removeFromSelection, objects }
} = useInjectedViewerInterfaceState()

const isSelected = computed(() => {
  return !!objects.value.find((o) => o.id === speckleData.id)
})

const setSelection = (e: MouseEvent) => {
  if (isSelected.value && !e.shiftKey) {
    // TODO: remove from selection
    clearSelection()
    return
  }
  if (isSelected.value && e.shiftKey) {
    removeFromSelection(speckleData as Record<string, unknown>)
    return
  }
  if (!e.shiftKey) clearSelection()
  addToSelection(speckleData as Record<string, unknown>)
}
</script>
