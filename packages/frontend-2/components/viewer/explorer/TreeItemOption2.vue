<template>
  <!--     -->
  <!-- WIP -->
  <!--     -->
  <div class="w-full">
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
          class="flex items-center space-x-1 overflow-hidden flex-grow hover:bg-foundation-focus cursor-pointer rounded-md px-1"
          @click="setSelection"
        >
          <div :class="`truncate ${unfold ? 'font-semibold' : ''}`">
            <div class="text-sm truncate">
              <!-- Note, enforce header from parent if provided (used in the case of root nodes) -->
              {{ header || headerAndSubheader.header }}
            </div>
            <div class="text-tiny text-foreground-2 truncate">
              {{ subHeader || headerAndSubheader.subheader }}
            </div>
          </div>
          <div class="flex-grow"></div>
          <div class="flex items-center space-x-1 flex-shrink-0">
            <div v-if="isSingleCollection || isMultipleCollection">
              <span class="text-foreground-2 text-xs">
                ({{ treeItem.children.length }})
              </span>
            </div>
            <div v-if="!(isSingleCollection || isMultipleCollection)">
              <EyeIcon class="w-3 h-3" />
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
    <div v-if="unfold" class="relative pl-2 text-xs">
      <!-- If we have array collections -->
      <div v-if="isMultipleCollection">
        <!-- mul col items -->
        <div v-for="collection in arrayCollections" :key="collection.data.name">
          <TreeItemOption2
            :item-id="(collection.data.id as string)"
            :tree-item="collection"
            :depth="depth + 1"
            :debug="debug"
          />
        </div>
      </div>
      <!-- If we have a single model collection -->
      <div v-if="isSingleCollection">
        <!-- single col items -->
        <div v-for="item in singleCollectionItems" :key="item.data?.id">
          <TreeItemOption2
            :item-id="(item.data?.id as string)"
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
import { ChevronDownIcon, EyeIcon } from '@heroicons/vue/24/solid'
import { Ref } from 'vue'
import {
  ExplorerNode,
  SpeckleObject,
  SpeckleReference
} from '~~/lib/common/helpers/sceneExplorer'
import { useInjectedViewer } from '~~/lib/viewer/composables/setup'

const { instance: viewer } = useInjectedViewer()
const dataTree = inject('dataTree')

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
const speckleData = props.treeItem?.data as SpeckleObject
const rawSpeckleData = props.treeItem?.data as Record<string, unknown>

const objectSpeckleType = computed(() => {
  return (rawSpeckleData.speckle_type as string)?.split('.').reverse()[0]
})

const objectName = computed(() => {
  return (rawSpeckleData.name as string) || (rawSpeckleData.Name as string)
})

type HeaderSubheader = {
  header: string
  subheader: string
}

const headerAndSubheader = computed(() => {
  const speckleType = speckleData.speckle_type as string
  if (!speckleType)
    return {
      header: rawSpeckleData.name || rawSpeckleData.Name || rawSpeckleData.speckle_type,
      subheader: ''
    } as HeaderSubheader

  // Handle revit objects
  if (speckleType.toLowerCase().includes('revit')) {
    if (speckleType.toLowerCase().includes('familyinstance')) {
      // TODO
      const famHeader = `${rawSpeckleData.family as string} (${
        rawSpeckleData.category as string
      })`
      const famSubheader = rawSpeckleData.type
      return { header: famHeader, subheader: famSubheader }
    }

    if (speckleType.toLowerCase().includes('revitelementtype')) {
      return {
        header: rawSpeckleData.family,
        subheader: rawSpeckleData.type + ' / ' + rawSpeckleData.category
      }
    }
    const anyHeader = speckleType.split('.').reverse()[0]
    const anySubheaderParts = [rawSpeckleData.category, rawSpeckleData.type].filter(
      (part) => !!part
    )
    return {
      header: anyHeader,
      subheader: anySubheaderParts.join(' / ')
    } as HeaderSubheader
  }

  // Handle ifc objects
  if (speckleType.toLowerCase().includes('ifc')) {
    const name = rawSpeckleData.Name || rawSpeckleData.name
    return {
      header: name || rawSpeckleData.speckleType,
      subheader: name ? rawSpeckleData.speckle_type : rawSpeckleData.id
    } as HeaderSubheader
  }

  if (speckleType.toLowerCase().includes('objects.geometry')) {
    return {
      header: speckleType.split('.').reverse()[0],
      subheader: rawSpeckleData.id
    } as HeaderSubheader
  }

  return {
    header: rawSpeckleData.name || rawSpeckleData.Name || rawSpeckleData.speckle_type,
    subheader: speckleType.split('.').reverse()[0]
  } as HeaderSubheader
})

const isSingleCollection = computed(() => {
  return (
    isNonEmptyObjectArray(speckleData.children) ||
    isNonEmptyObjectArray(speckleData.elements)
  )
})

const singleCollectionItems = computed(() => {
  const treeItems = props.treeItem.children.filter((child) => !!child.data?.id) // filter out random tree children (no id means they're not actual objects)
  // Handle the case of a wall, roof or other atomic objects that have nested children
  if (isNonEmptyObjectArray(speckleData.elements) && isAtomic.value) {
    // We need to filter out children that are not direct descendants of `elements`
    // Note: this is a current assumption convention.
    const ids = (speckleData.elements as SpeckleReference[]).map(
      (obj) => obj.referencedId
    )
    return treeItems.filter((item) => ids.includes(item.data?.id as string))
  }
  return treeItems
})

type ExplorerModelCollection = {
  data: {
    name: string
    id: string
    children: SpeckleObject[]
  }
  children: ExplorerNode[]
}

// Creates a list of all model collections that are not defined as collections. specifically, handles cases such as
// object { @boat: [obj, obj, obj], @harbour: [obj, obj, obj], etc. }
// @boat and @harbour would ideally be model collections, but, alas, connectors don't have that yet.
const arrayCollections = computed(() => {
  const arr = [] as ExplorerModelCollection[]
  for (const k of Object.keys(rawSpeckleData)) {
    if (k === 'children' || k === 'elements' || k.includes('displayValue')) continue

    const val = rawSpeckleData[k] as SpeckleReference[]
    if (!isNonEmptyObjectArray(val)) continue

    const ids = val.map((ref) => ref.referencedId) // NOTE: we're assuming all collections have refs inside; might revisit/to think re edge cases

    const actualRawRefs = props.treeItem.children.filter((node) =>
      ids.includes(node.data?.id as string)
    )

    if (actualRawRefs.length === 0) continue // bypasses chunks: if the actual object is not part of the tree item's children, it means it's a sublimated type (ie, a chunk). the assumption we're making is that any list of actual atomic objects is not chunked.
    const modelCollectionItem = {
      data: {
        name: k,
        id: k,
        // eslint-disable-next-line camelcase
        speckle_type: 'Array Collection',
        children: actualRawRefs.map((ref) => ref.data) as SpeckleObject[]
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

// YOLO hack
const selectedObject = inject('selectedObject') as Ref<Record<string, unknown>>
const setSelection = () => {
  console.log(props.treeItem)
  console.log(isReactive(props.treeItem))
  if (selectedObject.value?.id === speckleData.id) selectedObject.value = null
  else selectedObject.value = markRaw(speckleData)
}
</script>
