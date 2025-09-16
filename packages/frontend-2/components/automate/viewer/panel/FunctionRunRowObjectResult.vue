<template>
  <div class="overflow-hidden">
    <button
      :class="`block w-full transition text-left hover:bg-primary-muted hover:shadow-md rounded-md p-1 cursor-pointer border-l-2  ${
        isIsolated || isGradientActive
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
          {{ result.category }}: {{ resultObjectIds.length }} affected elements
        </div>
      </div>
      <div v-if="result.message" class="text-xs text-foreground-2 pl-5">
        {{ result.message }}
      </div>
    </button>
    <div class="flex mt-2 px-3 overflow-hidden">
      <ViewerFiltersFilterNumeric
        v-if="isGradientActive && computedFilterData"
        :filter="computedFilterData"
        no-padding
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
import { useSelectionUtilities } from '~~/lib/viewer/composables/ui'
import { useFilterUtilities } from '~/lib/viewer/composables/filtering/filtering'
import { useFilterColoringHelpers } from '~/lib/viewer/composables/filtering/coloringHelpers'
import type { NumericPropertyInfo } from '@speckle/viewer'
import { containsAll } from '~~/lib/common/helpers/utils'
import type { Automate } from '@speckle/shared'
import type { NumericFilterData } from '~/lib/viewer/helpers/filters/types'
import { isNumericFilter } from '~/lib/viewer/helpers/filters/types'
import { injectGradientDataIntoDataStore } from '~/lib/viewer/helpers/filters/utils'

type ObjectResult = Automate.AutomateTypes.ResultsSchema['values']['objectResults'][0]

const props = defineProps<{
  result: ObjectResult
  functionId?: string
}>()

const {
  viewer: {
    metadata: { filteringState, filteringDataStore }
  }
} = useInjectedViewerState()

const { isolateObjects, resetFilters, addActiveFilter, toggleFilterApplied, filters } =
  useFilterUtilities()
const { setSelectionFromObjectIds, clearSelection } = useSelectionUtilities()
const { setColorFilter, removeColorFilter } = useFilterColoringHelpers()

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
  const ids = resultObjectIds.value
  return containsAll(ids, isolatedObjects.value)
})

const resultObjectIds = computed(() => {
  if ('objectIds' in props.result) return props.result.objectIds
  return Object.keys(props.result.objectAppIds)
})

const handleClick = () => {
  if (hasMetadataGradient.value) {
    setOrUnsetGradient()
    return
  }

  isolateOrUnisolateObjects()
}

const isolateOrUnisolateObjects = () => {
  const ids = resultObjectIds.value
  const isCurrentlyIsolated = isIsolated.value

  resetFilters()
  if (isCurrentlyIsolated) {
    clearSelection()
  } else {
    isolateObjects(ids, { replace: true })
    setSelectionFromObjectIds(ids)
  }
}

const metadataGradientIsSet = ref(false)

const isGradientActive = computed(() => {
  if (!props.functionId) return false

  const hasFilter = filters.propertyFilters.value.some(
    (f) => f.filter?.key === props.functionId
  )
  const hasColorFilter =
    filters.activeColorFilterId.value !== null &&
    filters.propertyFilters.value.some(
      (f) =>
        f.id === filters.activeColorFilterId.value && f.filter?.key === props.functionId
    )

  return hasFilter && hasColorFilter
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

const computedFilterData = computed((): NumericFilterData | undefined => {
  if (!isGradientActive.value || !props.functionId) return

  const activeFilter = filters.propertyFilters.value.find(
    (f) => f.filter?.key === props.functionId
  )

  return activeFilter && isNumericFilter(activeFilter) ? activeFilter : undefined
})

const setOrUnsetGradient = () => {
  if (isGradientActive.value) {
    resetFilters()
    removeColorFilter()
    metadataGradientIsSet.value = false
    return
  }
  resetFilters()
  if (!props.result.metadata) return
  if (!computedPropInfo.value) return
  if (!props.functionId) return

  const gradientValues = props.result.metadata?.gradientValues || {}
  injectGradientDataIntoDataStore(filteringDataStore, props.functionId, gradientValues)

  metadataGradientIsSet.value = true
  const filterId = addActiveFilter(computedPropInfo.value)
  toggleFilterApplied(filterId)

  setColorFilter(filterId)
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

watch(
  () => filters.propertyFilters.value,
  (newFilters) => {
    if (!props.functionId) return
    const hasFilter = newFilters.some((f) => f.filter?.key === props.functionId)
    if (!hasFilter && metadataGradientIsSet.value) {
      metadataGradientIsSet.value = false
    }
  },
  { deep: true }
)
</script>
