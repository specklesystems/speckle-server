<template>
  <div>
    <div class="flex items-center mb-2">
      <div>
        <div class="overflow-hidden flex-shrink-0">
          <button
            class="h-full hover:bg-primary-muted hover:text-primary rounded flex items-center space-x-2"
            @click="unfold = !unfold"
          >
            <ChevronDownIcon
              :class="`w-3 h-3 transition ${!unfold ? '-rotate-90' : 'rotate-0'}`"
            />
            <div class="text-xs font-bold">{{ headerAndSubheader.header }}</div>
          </button>
        </div>
      </div>
      <!-- <div class="text-xs font-bold">{{ title }}</div> -->
    </div>
    <div v-if="unfold" class="ml-2 space-y-1">
      <div v-for="(kvp, index) in categorisedValuePairs.primitives" :key="index">
        <div class="grid grid-cols-3">
          <div
            class="truncate text-xs col-span-1 font-bold"
            :title="(kvp.key as string)"
          >
            {{ kvp.key }}
          </div>
          <div class="truncate text-xs col-span-2" :title="(kvp.value as string)">
            {{ kvp.value }}
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
      <div v-for="(kvp, index) in categorisedValuePairs.arrays" :key="index">
        {{ kvp.key }}:{{ kvp.type }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { XMarkIcon, ChevronDownIcon } from '@heroicons/vue/24/solid'
import { onKeyStroke } from '@vueuse/core'
import { useInjectedViewerInterfaceState } from '~~/lib/viewer/composables/setup'
import { getHeaderAndSubheaderForSpeckleObject } from '~~/lib/object-sidebar/helpers'

const props = withDefaults(
  defineProps<{
    object: Record<string, unknown>
    title?: string
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
  // 'displayMesh',
  // 'displayValue',
  // 'totalChildrenCount',
  '__importedUrl',
  '__parents'
]

const keyValuePairs = computed(() => {
  const kvps = [] as Record<string, unknown>[]

  const objectKeys = Object.keys(props.object)
  for (const key of objectKeys) {
    if (ignoredProps.includes(key)) continue
    const type = Array.isArray(props.object[key]) ? 'array' : typeof props.object[key]
    let innerType = null
    let arrayLength = null
    if (type === 'array') {
      const arr = props.object[key] as unknown[]
      arrayLength = arr.length
      if (arr.length > 0) innerType = Array.isArray(arr[0]) ? 'array' : typeof arr[0]
    }
    kvps.push({
      key,
      type,
      innerType,
      arrayLength,
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
    arrays: keyValuePairs.value.filter(
      (item) => item.type === 'array' && item.value !== null
    )
  }
})
</script>
