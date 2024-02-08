<template>
  <div :class="`overflow-hidden`">
    <button
      :class="`block transition text-left hover:bg-primary-muted hover:shadow-md rounded-md p-1 cursor-pointer border-l-2  ${
        isIsolated || metadataGradientIsSet
          ? 'border-primary bg-primary-muted shadow-md'
          : 'border-transparent'
      }`"
      @click="handleClick()"
    >
      <div class="flex items-center space-x-1">
        <div>
          <Component :is="iconAndColor.icon" :class="`w-4 h-4 ${iconAndColor.color}`" />
        </div>
        <div :class="`text-xs ${iconAndColor.color}`">
          {{ result.category }}: {{ result.objectIds.length }} affected elements
        </div>
      </div>
      <div v-if="result.message" class="text-xs text-foreground-2 pl-5">
        {{ result.message }}
      </div>
    </button>
    <div class="flex mt-2 ml-3 overflow-hidden">
      <ViewerExplorerNumericFilter
        v-if="metadataGradientIsSet && computedPropInfo"
        :filter="computedPropInfo"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  XMarkIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useFilterUtilities } from '~~/lib/viewer/composables/ui'
import type { NumericPropertyInfo } from '@speckle/viewer'

type ObjectResultWithOptionalMetadata = {
  category: string
  objectIds: string[]
  message: string | null
  level: 'ERROR' | 'WARNING' | 'INFO'
  metadata?: {
    gradient?: boolean
    gradientValues: Record<string, { gradientValue: number }> // TODO simplify convention, it's unweildly
  }
}

const props = defineProps<{
  result: ObjectResultWithOptionalMetadata
  functionId: string
}>()

const {
  viewer: {
    metadata: { filteringState }
  }
} = useInjectedViewerState()

const { isolateObjects, resetFilters, setPropertyFilter, applyPropertyFilter } =
  useFilterUtilities()

import { containsAll } from '~~/lib/common/helpers/utils'

const hasMetadataGradient = computed(() => {
  if (props.result.metadata?.gradient) return true
  return false
})

const isolatedObjects = computed(() => filteringState.value?.isolatedObjects)
const isIsolated = computed(() => {
  if (!isolatedObjects.value) return false
  if (filteringState.value?.activePropFilterKey === props.functionId) return false
  const ids = props.result.objectIds
  return containsAll(ids, isolatedObjects.value)
})

const handleClick = () => {
  if (hasMetadataGradient.value) {
    setOrUnsetGradient()
    return
  }
  isolateOrUnisolateObjects()
}

const isolateOrUnisolateObjects = () => {
  const ids = props.result.objectIds
  if (!isIsolated.value) {
    resetFilters()
    isolateObjects(ids)
    return
  }
  resetFilters()
}

const metadataGradientIsSet = ref(false)

watch(filteringState, (newVal) => {
  if (newVal?.activePropFilterKey !== props.functionId)
    metadataGradientIsSet.value = false
})

// NOTE: This is currently a hacky convention!!!
const computedPropInfo = computed(() => {
  if (!hasMetadataGradient.value) return
  if (!props.result.metadata) return
  const propInfo: NumericPropertyInfo = {
    objectCount: 0,
    key: props.functionId,
    type: 'number',
    min: Number.MAX_VALUE,
    max: Number.MIN_VALUE,
    valueGroups: [],
    passMin: 0,
    passMax: 0
  }

  const keys = Object.keys(props.result.metadata.gradientValues)
  propInfo.objectCount = keys.length
  for (const key of keys) {
    const value = props.result.metadata.gradientValues[key].gradientValue
    const valueGroup = {
      id: key,
      value
    }
    propInfo.valueGroups.push(valueGroup)
    if (propInfo.max < value) propInfo.max = value
    if (propInfo.min > value) propInfo.min = value
  }
  propInfo.passMax = propInfo.max
  propInfo.passMin = propInfo.min
  return propInfo
})

const setOrUnsetGradient = () => {
  if (metadataGradientIsSet.value) {
    resetFilters()
    metadataGradientIsSet.value = false
    return
  }
  resetFilters()
  if (!props.result.metadata) return
  if (!computedPropInfo.value) return

  metadataGradientIsSet.value = true
  setPropertyFilter(computedPropInfo.value)
  applyPropertyFilter()
}

const iconAndColor = computed(() => {
  switch (props.result.level) {
    case 'ERROR':
      return {
        icon: XMarkIcon,
        color: 'text-danger font-bold'
      }
    case 'WARNING':
      return {
        icon: ExclamationTriangleIcon,
        color: 'text-warning font-bold'
      }
    case 'INFO':
      return {
        icon: InformationCircleIcon,
        color: 'text-foreground font-bold'
      }
  }
  return {
    icon: XMarkIcon,
    color: 'text-danger font-bold'
  }
})
</script>
