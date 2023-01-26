<template>
  <div>
    <div class="flex items-center mb-1">
      <button
        class="h-full hover:bg-primary-muted hover:text-primary rounded flex items-center space-x-1 min-w-0"
        @click="unfold = !unfold"
      >
        <ChevronDownIcon
          :class="`w-3 h-3 transition ${!unfold ? '-rotate-90' : 'rotate-0'}`"
        />
        <div class="text-xs font-bold truncate">
          {{ title || headerAndSubheader.header }}
        </div>
      </button>
    </div>
    <div v-if="unfold" class="ml-1 space-y-1">
      <div
        v-for="(kvp, index) in [
          ...categorisedValuePairs.primitives,
          ...categorisedValuePairs.nulls
        ]"
        :key="index"
      >
        <div
          :class="`grid grid-cols-3 ${
            kvp.value === null || kvp.value === undefined ? 'text-foreground-2' : ''
          }`"
        >
          <div
            class="truncate text-xs col-span-1 font-bold"
            :title="(kvp.key as string)"
          >
            {{ kvp.key }}
          </div>
          <div class="truncate text-xs col-span-2" :title="(kvp.value as string)">
            <!-- NOTE: can't do kvp.value || 'null' because 0 || 'null' = 'null' -->
            {{ kvp.value === null ? 'null' : kvp.value }}
          </div>
        </div>
      </div>
      <div v-for="(kvp, index) in categorisedValuePairs.objects" :key="index">
        <ViewerSelectionObject
          :object="(kvp.value as Record<string,unknown>) || {}"
          :title="(kvp.key as string)"
          :unfold="false"
        />
      </div>
      <div
        v-for="(kvp, index) in categorisedValuePairs.nonPrimitiveArrays"
        :key="index"
        class="text-xs"
      >
        {{ kvp.key }}:{{ kvp.innerType }} ({{ kvp.arrayLength }})
      </div>
      <div v-for="(kvp, index) in categorisedValuePairs.primitiveArrays" :key="index">
        <div class="grid grid-cols-3">
          <div
            class="truncate text-xs col-span-1 font-bold"
            :title="(kvp.key as string)"
          >
            {{ kvp.key }}
          </div>
          <div
            class="truncate text-xs col-span-2 flex min-w-0 w-full"
            :title="(kvp.value as string)"
          >
            <div class="truncate flex-grow">{{ kvp.arrayPreview }}</div>
            <div class="text-foreground-2">({{ kvp.arrayLength }})</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ChevronDownIcon } from '@heroicons/vue/24/solid'
import {
  useInjectedViewer,
  useInjectedViewerInterfaceState
} from '~~/lib/viewer/composables/setup'
import { getHeaderAndSubheaderForSpeckleObject } from '~~/lib/object-sidebar/helpers'

const { instance: viewer } = useInjectedViewer()
const viewerTree = viewer.getWorldTree()

const props = withDefaults(
  defineProps<{
    object: Record<string, unknown>
    title: string
    unfold: boolean
    debug?: boolean
  }>(),
  { debug: false, unfold: true }
)

const unfold = ref(props.unfold)

const headerAndSubheader = computed(() => {
  return getHeaderAndSubheaderForSpeckleObject(props.object)
})

const ignoredProps = [
  '__closure',
  'displayMesh',
  'displayValue',
  'totalChildrenCount',
  '__importedUrl',
  '__parents'
]

const keyValuePairs = computed(() => {
  const kvps = [] as Record<string, unknown>[]

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

const categorisedValuePairs = computed(() => {
  return {
    primitives: keyValuePairs.value.filter(
      (item) => item.type !== 'object' && item.type !== 'array' && item.value !== null
    ),
    objects: keyValuePairs.value.filter(
      (item) => item.type === 'object' && item.value !== null
    ),
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
</script>
