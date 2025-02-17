<template>
  <div class="overflow-hidden">
    <button
      :class="`block w-full transition text-left hover:bg-primary-muted hover:shadow-md rounded-md p-1 cursor-pointer border-l-2  ${
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
  CheckIcon,
  XMarkIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useFilterUtilities, useSelectionUtilities } from '~~/lib/viewer/composables/ui'
import type { NumericPropertyInfo } from '@speckle/viewer'
import { containsAll } from '~~/lib/common/helpers/utils'
import type { Automate } from '@speckle/shared'

type ObjectResult = Automate.AutomateTypes.ResultsSchema['values']['objectResults'][0]

const props = defineProps<{
  result: ObjectResult
  functionId?: string
}>()

const {
  viewer: {
    metadata: { filteringState }
  }
} = useInjectedViewerState()

const { isolateObjects, resetFilters, setPropertyFilter, applyPropertyFilter } =
  useFilterUtilities()
const { setSelectionFromObjectIds, clearSelection } = useSelectionUtilities()

const hasMetadataGradient = computed(() => {
  if (props.result.metadata?.gradient) return true
  return false
})

const isolatedObjects = computed(() => filteringState.value?.isolatedObjects)
const isIsolated = computed(() => {
  if (!isolatedObjects.value?.length) return false
  if (
    props.functionId &&
    filteringState.value?.activePropFilterKey === props.functionId
  )
    return false
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
  const isCurrentlyIsolated = isIsolated.value

  resetFilters()
  if (isCurrentlyIsolated) {
    clearSelection()
  } else {
    isolateObjects(ids)
    setSelectionFromObjectIds(ids)
  }
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
  if (!props.functionId) return

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

  const gradientValues = props.result.metadata.gradientValues || {}
  propInfo.objectCount = Object.keys(gradientValues).length

  for (const [key, { gradientValue: value }] of Object.entries(gradientValues)) {
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
    case 'SUCCESS':
      return {
        icon: CheckIcon,
        color: 'text-success font-medium'
      }
    case 'ERROR':
      return {
        icon: XMarkIcon,
        color: 'text-danger font-medium'
      }
    case 'WARNING':
      return {
        icon: ExclamationTriangleIcon,
        color: 'text-warning font-medium'
      }
    case 'INFO':
    default:
      return {
        icon: InformationCircleIcon,
        color: 'text-foreground font-medium'
      }
  }
})
</script>
