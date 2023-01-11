<template>
  <!--     -->
  <!-- WIP -->
  <!--     -->
  <div class="w-full">
    <!-- Header -->
    <div class="bg-foundation py-2 hover:bg-primary-muted rounded-md px-1">
      <div class="flex items-center space-x-2">
        <div v-if="isSingleCollection || isMultipleCollection">
          <button
            class="bg-foundation-focus shadow xxx-text-foreground-on-primary flex items-center space-x-1 rounded-md pl-1 pr-1"
            @click="unfold = !unfold"
          >
            <ChevronDownIcon
              :class="`w-3 h-3 transition ${!unfold ? 'rotate-0' : 'rotate-180'}`"
            />
            <div
              class="w-4 h-4 text-tiny flex-shrink-0 flex items-center justify-center"
            >
              <span>{{ treeItem.children.length }}</span>
            </div>
          </button>
        </div>
        <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
        <div class="flex items-center space-x-2 min-w-0" @click="setSelection">
          <div class="text-sm truncate">
            {{
              rawSpeckleData.name ||
              rawSpeckleData.Name ||
              rawSpeckleData.speckle_type ||
              itemId
            }}
            {{ rawSpeckleData.speckle_type }}
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
    <div v-if="unfold" class="relative pl-4 text-xs z-0">
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
import { ChevronDownIcon } from '@heroicons/vue/24/solid'
import { Ref } from 'vue'
import {
  ExplorerNode,
  SpeckleObject,
  SpeckleReference
} from '~~/lib/common/helpers/sceneExplorer'
import { useInjectedViewer } from '~~/lib/viewer/composables/viewer'

const { viewer } = useInjectedViewer()
const dataTree = inject('dataTree')

const props = withDefaults(
  defineProps<{
    itemId: string
    treeItem: ExplorerNode
    depth: number
    debug?: boolean
  }>(),
  { depth: 1, debug: false }
)

const isAtomic = computed(() => props.treeItem.atomic === true)
const speckleData = props.treeItem?.data as SpeckleObject
const rawSpeckleData = props.treeItem?.data as Record<string, unknown>

const isSingleCollection = computed(() => {
  return (
    isNonEmptyObjectArray(speckleData.children) ||
    isNonEmptyObjectArray(speckleData.elements)
  )
})

const singleCollectionItems = computed(() => {
  const treeItems = props.treeItem.children.filter((child) => !!child.data?.id) // filter out random tree children (no id means they're not actual objects)
  // Handle the case of a wall being an atomic object as well as having nested children
  if (isNonEmptyObjectArray(speckleData.elements) && isAtomic.value) {
    // We need to filter out children that are not direct descendants of `elements`
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
        children: actualRawRefs.map((ref) => ref.data) as SpeckleObject[]
      },
      children: actualRawRefs
    }
    arr.push(modelCollectionItem)
  }

  return arr
})

const isMultipleCollection = computed(() => arrayCollections.value.length > 0)

const unfold = ref(false)

const isNonEmptyArray = (x: unknown) => !!x && Array.isArray(x) && x.length > 0

const isNonEmptyObjectArray = (x: unknown) => isNonEmptyArray(x) && isObject(x[0])

const isObject = (x: unknown) =>
  typeof x === 'object' && !Array.isArray(x) && x !== null

// YOLO hack
const selectedObject = inject('selectedObject') as Ref<Record<string, unknown>>
const setSelection = () => {
  console.log(props.treeItem)
  if (selectedObject.value?.id === speckleData.id) selectedObject.value = null
  else selectedObject.value = speckleData
}
</script>
