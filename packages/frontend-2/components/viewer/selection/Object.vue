<template>
  <div
    :class="`${
      isModifiedQuery.modified && root
        ? 'outline outline-2 rounded py-1 px-1 outline-amber-500'
        : ''
    }`"
  >
    <div class="mb-1 flex items-center">
      <button
        class="flex h-full w-full pl-1 pr-2 py-1 items-center gap-1 rounded-[2px] bg-foundation-2"
        @click="unfold = !unfold"
        @mouseenter="highlightObject"
        @focusin="highlightObject"
        @mouseleave="unhighlightObject"
        @focusout="unhighlightObject"
      >
        <IconTriangle
          :class="`h-3 w-3 shrink-0 ${headerClasses} ${unfold ? 'rotate-90' : ''}`"
        />
        <div :class="`truncate text-body-3xs font-medium ${headerClasses}`">
          {{ title || headerAndSubheader.header }}
          <span
            v-if="(props.root || props.modifiedSibling) && isModifiedQuery.modified"
          >
            {{ isModifiedQuery.isNew ? '(new)' : '(old)' }}
          </span>
        </div>
      </button>
    </div>
    <div v-if="unfold" class="space-y-1 pl-0 py-1 pr-2">
      <!-- key value pair display -->
      <ViewerSelectionKeyValuePair
        v-for="(kvp, index) in [
          ...categorisedValuePairs.primitives,
          ...categorisedValuePairs.nulls
        ]"
        :key="index"
        :kvp="kvp"
      />
      <div
        v-for="(kvp, index) in categorisedValuePairs.objects"
        :key="index"
        class="pl-2"
      >
        <ViewerSelectionObject
          :object="(kvp.value as SpeckleObject) || {}"
          :title="(kvp.key as string)"
          :unfold="autoUnfoldKeys.includes(kvp.key)"
          :parent-path="currentPath"
        />
      </div>
      <div
        v-for="(kvp, index) in categorisedValuePairs.nonPrimitiveArrays"
        :key="index"
        class="text-body-3xs"
      >
        <div class="text-foreground-2 grid grid-cols-3 pl-2">
          <div
            class="col-span-1 truncate text-body-3xs font-medium"
            :title="(kvp.key as string)"
          >
            {{ kvp.key }}
          </div>
          <div
            class="group col-span-2 flex w-full min-w-0 truncate text-body-3xs pl-1 text-foreground items-center gap-1"
          >
            <div class="flex-grow truncate">{{ kvp.innerType }} array</div>
            <div class="text-foreground-2">({{ kvp.arrayLength }})</div>
            <LayoutMenu
              v-model:open="arrayMenuState[`${index}-nonprimitive`]"
              :items="getArrayMenuItems(kvp)"
              mount-menu-on-body
              @click.stop.prevent
              @chosen="(params) => onArrayActionChosen(params, kvp)"
            >
              <button
                class="group-hover:opacity-100 hover:bg-highlight-1 rounded h-4 w-4 flex items-center justify-center opacity-0"
                :class="
                  arrayMenuState[`${index}-nonprimitive`]
                    ? 'bg-highlight-1 opacity-100'
                    : ''
                "
                @click.stop="
                  arrayMenuState[`${index}-nonprimitive`] =
                    !arrayMenuState[`${index}-nonprimitive`]
                "
              >
                <Ellipsis class="h-3 w-3" />
              </button>
            </LayoutMenu>
          </div>
        </div>
      </div>
      <div v-for="(kvp, index) in categorisedValuePairs.primitiveArrays" :key="index">
        <div class="grid grid-cols-3">
          <div
            class="col-span-1 truncate text-body-3xs font-medium pl-2 text-foreground-2"
            :title="(kvp.key as string)"
          >
            {{ kvp.key }}
          </div>
          <div
            class="group col-span-2 flex w-full min-w-0 truncate text-body-3xs text-foreground items-center gap-1"
            :title="(kvp.value as string)"
          >
            <div class="pl-2.5 truncate">{{ kvp.arrayPreview }}</div>
            <LayoutMenu
              v-model:open="arrayMenuState[`${index}-primitive`]"
              :items="getArrayMenuItems(kvp)"
              mount-menu-on-body
              @click.stop.prevent
              @chosen="(params) => onArrayActionChosen(params, kvp)"
            >
              <button
                class="group-hover:opacity-100 hover:bg-highlight-1 rounded h-4 w-4 flex items-center justify-center opacity-0"
                :class="
                  arrayMenuState[`${index}-primitive`]
                    ? 'bg-highlight-1 opacity-100'
                    : ''
                "
                @click.stop="
                  arrayMenuState[`${index}-primitive`] =
                    !arrayMenuState[`${index}-primitive`]
                "
              >
                <Ellipsis class="h-3 w-3" />
              </button>
            </LayoutMenu>
            <div class="text-foreground-2 ml-auto">({{ kvp.arrayLength }})</div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="isModifiedQuery.modified && isModifiedQuery.pair && root" class="mt-2">
      <ViewerSelectionObject :object="isModifiedQuery.pair" :modified-sibling="true" />
    </div>
  </div>
</template>
<script setup lang="ts">
import type { SpeckleObject } from '~~/lib/viewer/helpers/sceneExplorer'
import { getHeaderAndSubheaderForSpeckleObject } from '~~/lib/object-sidebar/helpers'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useHighlightedObjectsUtilities } from '~/lib/viewer/composables/ui'
import type { KeyValuePair } from '~/components/viewer/selection/types'
import { LayoutMenu, type LayoutMenuItem } from '@speckle/ui-components'
import { Ellipsis } from 'lucide-vue-next'
import { useFilterUtilities } from '~/lib/viewer/composables/filtering/filtering'
import {
  ArrayFilterCondition,
  type ExtendedPropertyInfo
} from '~/lib/viewer/helpers/filters/types'

const {
  ui: {
    diff: { result, enabled: diffEnabled },
    panels: { active: activePanel }
  }
} = useInjectedViewerState()

const {
  isKvpFilterable,
  getFilterDisabledReason,
  findFilterByKvp,
  addActiveFilter,
  updateFilterCondition,
  getPropertyOptionsFromDataStore
} = useFilterUtilities()

const props = withDefaults(
  defineProps<{
    object: SpeckleObject
    root?: boolean
    title?: string
    unfold?: boolean
    debug?: boolean
    modifiedSibling?: boolean
    parentPath?: string
  }>(),
  { debug: false, unfold: false, root: false, modifiedSibling: false }
)

const { highlightObjects, unhighlightObjects } = useHighlightedObjectsUtilities()
const unfold = ref(props.unfold)
const autoUnfoldKeys = ['properties', 'Instance Parameters']

// Array menu state management
const arrayMenuState = ref<Record<string, boolean>>({})

const availableFilters = computed(
  () => getPropertyOptionsFromDataStore() as ExtendedPropertyInfo[]
)

// Compute the current full path for this object
const currentPath = computed(() => {
  if (props.root) return ''
  if (!props.parentPath) return props.title || ''
  return props.parentPath
    ? `${props.parentPath}.${props.title || ''}`
    : props.title || ''
})

const isAdded = computed(() => {
  if (!diffEnabled.value) return false
  return (
    result.value?.added.findIndex(
      (o) => (o.model.raw as SpeckleObject).applicationId === props.object.applicationId
    ) !== -1
  )
})

const isRemoved = computed(() => {
  if (!diffEnabled.value) return false
  return (
    result.value?.removed.findIndex(
      (o) => (o.model.raw as SpeckleObject).applicationId === props.object.applicationId
    ) !== -1
  )
})

const isUnchanged = computed(() => {
  if (!diffEnabled.value) return false
  return (
    result.value?.unchanged.findIndex(
      (o) => (o.model.raw as SpeckleObject).applicationId === props.object.applicationId
    ) !== -1
  )
})

const isModifiedQuery = computed(() => {
  // if (props.modifiedSibling) return { modified: false } // prevent recursion?
  if (!diffEnabled.value) return { modified: false }
  const modifiedObjectPairs = result.value?.modified.map((pair) => {
    return [pair[0].model.raw as SpeckleObject, pair[1].model.raw as SpeckleObject]
  })
  if (!modifiedObjectPairs) return { modified: false }
  const obj = props.object
  const pairedItems = modifiedObjectPairs.find(
    (item) => item[0].id === obj.id || item[1].id === obj.id
  )
  if (!pairedItems) return { modified: false }
  const pair = pairedItems[0].id === obj.id ? pairedItems[1] : pairedItems[0]
  if (!pair) return { modified: false }
  return {
    modified: true,
    pair,
    isNew: pairedItems[0].id !== obj.id
  }
})

const headerClasses = computed(() => {
  if (props.modifiedSibling) return 'text-amber-500'
  if (!props.root) return ''
  if (!diffEnabled.value) return ''
  if (!Object.keys(props.object).includes('applicationId')) return ''
  if (isAdded.value) return 'text-green-500'
  if (isRemoved.value) return 'text-red-500'
  if (isUnchanged.value) return 'text-foreground-2'
  return 'text-amber-500'
})

const headerAndSubheader = computed(() => {
  return getHeaderAndSubheaderForSpeckleObject(props.object)
})

const ignoredProps = [
  '__closure',
  'displayMesh',
  'displayValue',
  'totalChildrenCount',
  '__importedUrl',
  '__parents',
  'bbox'
]

const keyValuePairs = computed(() => {
  const kvps: KeyValuePair[] = []

  // handle revit paramters
  if (props.title === 'parameters') {
    const paramKeys = Object.keys(props.object)
    for (const prop of paramKeys) {
      const param = props.object[prop]
      if (!param || typeof param !== 'object' || param === null) continue
      if (!('name' in param) || typeof param.name !== 'string') continue
      if (!('value' in param)) continue

      kvps.push({
        key: param.name,
        type: typeof param.value,
        innerType: null,
        arrayLength: null,
        arrayPreview: null,
        value: param.value
      })
    }
    return kvps
  }

  const objectKeys = Object.keys(props.object)
  for (const key of objectKeys) {
    if (ignoredProps.includes(key)) continue

    const type = Array.isArray(props.object[key]) ? 'array' : typeof props.object[key]
    let innerType = null
    let arrayLength = null
    let arrayPreview = null
    if (type === 'array') {
      const arr = props.object[key] as unknown[]
      arrayLength = arr.length
      if (arr.length > 0) {
        innerType = Array.isArray(arr[0]) ? 'array' : typeof arr[0]
        // We truncate this above with css - but limit to 100 to limit dom size
        arrayPreview = arr.slice(0, 100).join(', ')
      }
    }

    if (
      props.object[key] &&
      isNameValuePair(props.object[key] as Record<string, unknown>)
    ) {
      // note: handles name value pairs from dui3 -
      const { value, units } = props.object[key] as { value: string; units?: string }
      const fullPath = currentPath.value ? `${currentPath.value}.${key}` : key
      kvps.push({
        key,
        type: typeof value,
        value: value as string,
        units,
        backendPath: fullPath
      })
      continue
    }
    const fullPath = currentPath.value ? `${currentPath.value}.${key}` : key
    kvps.push({
      key,
      type,
      innerType,
      arrayLength,
      arrayPreview,
      value: props.object[key],
      backendPath: fullPath
    })
  }

  return kvps
})

const isNameValuePair = (obj: Record<string, unknown>) => {
  const keys = Object.keys(obj)
  return keys.includes('name') && keys.includes('value')
}

const categorisedValuePairs = computed(() => {
  return {
    primitives: keyValuePairs.value.filter(
      (item) => item.type !== 'object' && item.type !== 'array' && item.value !== null
    ),
    objects: keyValuePairs.value
      .filter((item) => item.type === 'object' && item.value !== null)
      .filter((item) => {
        const keys = Object.keys(item.value as unknown as Record<string, unknown>)
        const nvp = keys.includes('name') && keys.includes('value')
        return !nvp
      }) // filters out name value pairs - note on new properties structure coming out of DUI3
      .sort((a, b) => a.key.toLowerCase().localeCompare(b.key.toLowerCase())),
    nonPrimitiveArrays: keyValuePairs.value.filter(
      (item) =>
        item.type === 'array' &&
        item.value !== null &&
        (item.innerType === 'object' || item.innerType === 'array')
    ),
    primitiveArrays: keyValuePairs.value.filter(
      (item) =>
        item.type === 'array' &&
        item.value !== null &&
        !(item.innerType === 'object' || item.innerType === 'array')
    ),
    nulls: keyValuePairs.value.filter((item) => item.value === null)
  }
})

const highlightObject = () => {
  if (props.object.id && typeof props.object.id === 'string') {
    highlightObjects([props.object.id])
  }
}

const unhighlightObject = () => {
  if (props.object.id && typeof props.object.id === 'string') {
    unhighlightObjects([props.object.id])
  }
}

// Array filtering functions
const isArrayFilterable = (kvp: KeyValuePair): boolean => {
  if (!Array.isArray(kvp.value)) return false
  return isKvpFilterable(kvp, availableFilters.value)
}

const getArrayFilterDisabledReason = (kvp: KeyValuePair): string => {
  if (!Array.isArray(kvp.value)) return 'Not an array property'
  return getFilterDisabledReason(kvp, availableFilters.value)
}

const getArrayMenuItems = (kvp: KeyValuePair): LayoutMenuItem[][] => {
  const isFilterable = isArrayFilterable(kvp)

  return [
    [
      {
        title: 'Add to filters',
        id: 'add-to-filters',
        disabled: !isFilterable,
        disabledTooltip: isFilterable
          ? 'Add this array property to filters'
          : getArrayFilterDisabledReason(kvp)
      }
    ]
  ]
}

const handleAddArrayToFilters = (kvp: KeyValuePair) => {
  const filter = findFilterByKvp(kvp, availableFilters.value)
  if (filter && Array.isArray(kvp.value)) {
    addArrayFilterWithValue(filter, kvp)
  }
}

const addArrayFilterWithValue = (filter: ExtendedPropertyInfo, kvp: KeyValuePair) => {
  const filterId = addActiveFilter(filter)

  if (filter.type === 'array' && Array.isArray(kvp.value)) {
    // For array filters, default to "contains" condition
    updateFilterCondition(filterId, ArrayFilterCondition.Contains)
  }

  activePanel.value = 'filters'
}

const onArrayActionChosen = (params: { item: LayoutMenuItem }, kvp: KeyValuePair) => {
  const { item } = params

  // Don't execute if item is disabled
  if (item.disabled) return

  switch (item.id) {
    case 'add-to-filters':
      handleAddArrayToFilters(kvp)
      break
  }
}

watch(
  () => props.unfold,
  (newVal) => {
    unfold.value = newVal
  }
)
</script>
