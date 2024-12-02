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
        class="flex h-full w-full pl-1 pr-2 py-0.5 items-center gap-1 rounded bg-foundation-2 hover:sm:bg-primary-muted hover:text-primary"
        :class="unfold && 'text-primary'"
        @click="unfold = !unfold"
        @mouseenter="highlightObject"
        @focusin="highlightObject"
        @mouseleave="unhighlightObject"
        @focusout="unhighlightObject"
      >
        <ChevronDownIcon
          :class="`h-3 w-3 transition ${headerClasses} ${
            !unfold ? '-rotate-90' : 'rotate-0'
          }`"
        />
        <div :class="`truncate text-body-2xs font-medium ${headerClasses}`">
          {{ title || headerAndSubheader.header }}
          <span
            v-if="(props.root || props.modifiedSibling) && isModifiedQuery.modified"
          >
            {{ isModifiedQuery.isNew ? '(new)' : '(old)' }}
          </span>
        </div>
      </button>
    </div>
    <div v-if="unfold" class="space-y-1 px-0 py-1">
      <!-- key value pair display -->
      <div
        v-for="(kvp, index) in [
          ...categorisedValuePairs.primitives,
          ...categorisedValuePairs.nulls
        ]"
        :key="index"
        class="flex w-full"
      >
        <div
          :class="`grid grid-cols-3 w-full pl-2 py-0.5 ${
            kvp.value === null || kvp.value === undefined ? 'text-foreground-2' : ''
          }`"
        >
          <div
            class="col-span-1 truncate text-body-3xs mr-2 font-medium"
            :title="(kvp.key as string)"
          >
            {{ kvp.key }}
          </div>
          <div
            class="group col-span-2 pl-1 truncate text-body-3xs flex gap-1 items-center"
            :title="(kvp.value as string)"
          >
            <div class="flex gap-1 items-center w-full">
              <!-- NOTE: can't do kvp.value || 'null' because 0 || 'null' = 'null' -->
              <span
                class="truncate"
                :class="kvp.value === null ? '' : 'group-hover:max-w-[calc(100%-1rem)]'"
              >
                {{ kvp.value === null ? 'null' : kvp.value }}
              </span>
              <span v-if="kvp.units" class="truncate opacity-70">
                {{ kvp.units }}
              </span>
              <button
                v-if="isCopyable(kvp)"
                :class="isCopyable(kvp) ? 'cursor-pointer' : 'cursor-default'"
                class="opacity-0 group-hover:opacity-100 w-4"
                @click="handleCopy(kvp)"
              >
                <ClipboardDocumentIcon class="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        v-for="(kvp, index) in categorisedValuePairs.objects"
        :key="index"
        class="pl-2"
      >
        <ViewerSelectionObject
          :object="(kvp.value as SpeckleObject) || {}"
          :title="(kvp.key as string)"
          :unfold="autoUnfoldKeys.includes(kvp.key)"
        />
      </div>
      <div
        v-for="(kvp, index) in categorisedValuePairs.nonPrimitiveArrays"
        :key="index"
        class="text-xs"
      >
        <div class="text-foreground-2 grid grid-cols-3 pl-2">
          <div
            class="col-span-1 truncate text-xs font-medium"
            :title="(kvp.key as string)"
          >
            {{ kvp.key }}
          </div>
          <div class="col-span-2 flex w-full min-w-0 truncate text-xs pl-1">
            <div class="flex-grow truncate">{{ kvp.innerType }} array</div>
            <div class="text-foreground-2">({{ kvp.arrayLength }})</div>
          </div>
        </div>
      </div>
      <div v-for="(kvp, index) in categorisedValuePairs.primitiveArrays" :key="index">
        <div class="grid grid-cols-3">
          <div
            class="col-span-1 truncate text-xs font-medium pl-2"
            :title="(kvp.key as string)"
          >
            {{ kvp.key }}
          </div>
          <div
            class="col-span-2 flex w-full min-w-0 truncate text-xs"
            :title="(kvp.value as string)"
          >
            <div class="flex-grow truncate">{{ kvp.arrayPreview }}</div>
            <div class="text-foreground-2">({{ kvp.arrayLength }})</div>
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
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ChevronDownIcon } from '@heroicons/vue/24/solid'
import { ClipboardDocumentIcon } from '@heroicons/vue/24/outline'
import type { SpeckleObject } from '~~/lib/viewer/helpers/sceneExplorer'
import { getHeaderAndSubheaderForSpeckleObject } from '~~/lib/object-sidebar/helpers'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useHighlightedObjectsUtilities } from '~/lib/viewer/composables/ui'
const {
  ui: {
    diff: { result, enabled: diffEnabled }
  }
} = useInjectedViewerState()

const props = withDefaults(
  defineProps<{
    object: SpeckleObject
    root?: boolean
    title?: string
    unfold?: boolean
    debug?: boolean
    modifiedSibling?: boolean
  }>(),
  { debug: false, unfold: false, root: false, modifiedSibling: false }
)

const { highlightObjects, unhighlightObjects } = useHighlightedObjectsUtilities()

const unfold = ref(props.unfold)
const autoUnfoldKeys = ['properties', 'Instance Parameters']

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

  if (isUnchanged.value) return 'text-foreground'

  return 'text-amber-500'
})

const headerAndSubheader = computed(() => {
  return getHeaderAndSubheaderForSpeckleObject(props.object)
})

const isCopyable = (kvp: Record<string, unknown>) => {
  return kvp.value !== null && kvp.value !== undefined && typeof kvp.value !== 'object'
}

const handleCopy = async (kvp: Record<string, unknown>) => {
  const { copy } = useClipboard()
  if (isCopyable(kvp)) {
    const keyName = kvp.key as string
    await copy(kvp.value as string, {
      successMessage: `${keyName} copied to clipboard`,
      failureMessage: `Failed to copy ${keyName} to clipboard`
    })
  }
}

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
  const kvps = [] as (Record<string, unknown> & { key: string; value: unknown })[]

  // handle revit paramters
  if (props.title === 'parameters') {
    const paramKeys = Object.keys(props.object)
    for (const prop of paramKeys) {
      const param = props.object[prop] as Record<string, unknown>
      if (!param) continue
      kvps.push({
        key: param.name as string,
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
        arrayPreview = arr.slice(0, 3).join(', ')
        if (arr.length > 10) arrayPreview += ' ...' // in case truncate doesn't hit
      }
    }

    if (
      props.object[key] &&
      isNameValuePair(props.object[key] as Record<string, unknown>)
    ) {
      // note: handles name value pairs from dui3 -
      const { value, units } = props.object[key] as { value: string; units?: string }
      kvps.push({
        key,
        type: typeof value,
        value: value as string,
        units
      })
      continue
    }
    kvps.push({
      key,
      type,
      innerType,
      arrayLength,
      arrayPreview,
      value: props.object[key]
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
  highlightObjects([props.object.id])
}

const unhighlightObject = () => {
  unhighlightObjects([props.object.id])
}

watch(
  () => props.unfold,
  (newVal) => {
    unfold.value = newVal
  }
)
</script>
