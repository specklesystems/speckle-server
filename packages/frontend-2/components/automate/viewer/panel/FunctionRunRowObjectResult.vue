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
          {{ result.category }}: {{ resultObjectIds.length }} affected elements
        </div>
      </div>
      <div v-if="result.message" class="text-xs text-foreground-2 pl-5">
        {{ result.message }}
      </div>
    </button>
    <div class="flex mt-2 px-3 overflow-hidden">
      <ViewerFiltersFilterNumeric
        v-if="metadataGradientIsSet && computedFilterData"
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
    metadata: { filteringDataStore }
  }
} = useInjectedViewerState()

const { isolateObjects, resetFilters, addActiveFilter, filters } = useFilterUtilities()
const { setColorFilter, removeColorFilter } = useFilterColoringHelpers()
const logger = useLogger()

const hasMetadataGradient = computed(() => {
  const hasGradient = !!props.result.metadata?.gradient
  logger.debug('[FunctionRunRowObjectResult] hasMetadataGradient computed', {
    hasMetadata: !!props.result.metadata,
    hasGradient,
    gradientValue: props.result.metadata?.gradient
  })
  return hasGradient
})

const isIsolated = computed(() => {
  // Gradient results show active via metadataGradientIsSet
  if (hasMetadataGradient.value) {
    const isolated = metadataGradientIsSet.value
    logger.debug('[FunctionRunRowObjectResult] isIsolated (gradient path)', {
      metadataGradientIsSet: metadataGradientIsSet.value,
      isolated
    })
    return isolated
  }

  // Non-gradient results show active if their objects are isolated
  const isolatedIds = filters.isolatedObjectIds.value
  const ids = resultObjectIds.value
  const isolated = isolatedIds?.length ? containsAll(ids, isolatedIds) : false

  logger.debug('[FunctionRunRowObjectResult] isIsolated (non-gradient path)', {
    isolatedIds,
    resultIds: ids,
    isolatedIdsLength: isolatedIds?.length || 0,
    resultIdsLength: ids.length,
    isolated
  })

  return isolated
})

const resultObjectIds = computed(() => {
  const ids =
    'objectIds' in props.result
      ? props.result.objectIds
      : Object.keys(props.result.objectAppIds)

  logger.debug('[FunctionRunRowObjectResult] resultObjectIds computed', {
    hasObjectIds: 'objectIds' in props.result,
    hasObjectAppIds: 'objectAppIds' in props.result,
    idsCount: ids.length,
    firstFewIds: ids.slice(0, 3)
  })

  return ids
})

const handleClick = () => {
  try {
    logger.debug('[FunctionRunRowObjectResult] handleClick triggered', {
      functionId: props.functionId,
      resultCategory: props.result.category,
      resultLevel: props.result.level,
      hasMetadataGradient: hasMetadataGradient.value,
      metadataGradientIsSet: metadataGradientIsSet.value,
      isIsolated: isIsolated.value,
      resultObjectIds: resultObjectIds.value,
      resultMetadata: props.result.metadata
    })

    if (hasMetadataGradient.value) {
      logger.debug('[FunctionRunRowObjectResult] Taking gradient path')
      setOrUnsetGradient()
      return
    }

    logger.debug('[FunctionRunRowObjectResult] Taking isolation path')
    isolateOrUnisolateObjects()
  } catch (error) {
    logger.error('[FunctionRunRowObjectResult] Error in handleClick:', error)
  }
}

const isolateOrUnisolateObjects = () => {
  try {
    const ids = resultObjectIds.value
    const currentIsolatedIds = filters.isolatedObjectIds.value || []
    const wasIsolated = containsAll(ids, currentIsolatedIds)

    logger.debug('[FunctionRunRowObjectResult] isolateOrUnisolateObjects', {
      objectIds: ids,
      currentIsolatedIds,
      wasIsolated,
      idsLength: ids.length,
      currentIsolatedLength: currentIsolatedIds.length
    })

    logger.debug('[FunctionRunRowObjectResult] Calling resetFilters()')
    resetFilters()

    logger.debug('[FunctionRunRowObjectResult] Calling removeColorFilter()')
    removeColorFilter()

    logger.debug('[FunctionRunRowObjectResult] Setting metadataGradientIsSet to false')
    metadataGradientIsSet.value = false

    if (!wasIsolated) {
      logger.debug(
        '[FunctionRunRowObjectResult] Objects were not isolated, calling isolateObjects with ids:',
        ids
      )
      isolateObjects(ids)
    } else {
      logger.debug(
        '[FunctionRunRowObjectResult] Objects were already isolated, not calling isolateObjects'
      )
    }
  } catch (error) {
    logger.error(
      '[FunctionRunRowObjectResult] Error in isolateOrUnisolateObjects:',
      error
    )
  }
}

const metadataGradientIsSet = ref(false)

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
  if (!metadataGradientIsSet.value || !props.functionId) return

  const activeFilter = filters.propertyFilters.value.find(
    (f) => f.filter?.key === props.functionId
  )

  return activeFilter && isNumericFilter(activeFilter) ? activeFilter : undefined
})

const setOrUnsetGradient = () => {
  logger.debug('[FunctionRunRowObjectResult] setOrUnsetGradient called', {
    metadataGradientIsSet: metadataGradientIsSet.value,
    hasResultMetadata: !!props.result.metadata,
    computedPropInfo: computedPropInfo.value,
    functionId: props.functionId,
    gradientValues: props.result.metadata?.gradientValues
  })

  if (metadataGradientIsSet.value) {
    logger.debug('[FunctionRunRowObjectResult] Gradient is set, unsetting it')
    logger.debug(
      '[FunctionRunRowObjectResult] Calling resetFilters() from gradient unset'
    )
    resetFilters()
    logger.debug(
      '[FunctionRunRowObjectResult] Calling removeColorFilter() from gradient unset'
    )
    removeColorFilter()
    logger.debug(
      '[FunctionRunRowObjectResult] Setting metadataGradientIsSet to false from gradient unset'
    )
    metadataGradientIsSet.value = false
    return
  }

  logger.debug('[FunctionRunRowObjectResult] Setting gradient, calling resetFilters()')
  resetFilters()

  if (!props.result.metadata) {
    logger.debug('[FunctionRunRowObjectResult] No result metadata, returning early')
    return
  }

  if (!computedPropInfo.value) {
    logger.debug('[FunctionRunRowObjectResult] No computedPropInfo, returning early')
    return
  }

  if (!props.functionId) {
    logger.debug('[FunctionRunRowObjectResult] No functionId, returning early')
    return
  }

  const gradientValues = props.result.metadata?.gradientValues || {}
  logger.debug('[FunctionRunRowObjectResult] Injecting gradient data into data store', {
    functionId: props.functionId,
    gradientValuesKeys: Object.keys(gradientValues),
    gradientValuesCount: Object.keys(gradientValues).length
  })

  injectGradientDataIntoDataStore(filteringDataStore, props.functionId, gradientValues)

  logger.debug('[FunctionRunRowObjectResult] Setting metadataGradientIsSet to true')
  metadataGradientIsSet.value = true

  logger.debug(
    '[FunctionRunRowObjectResult] Adding active filter with propInfo:',
    computedPropInfo.value
  )
  const filterId = addActiveFilter(computedPropInfo.value)
  logger.debug('[FunctionRunRowObjectResult] Got filterId:', filterId)

  logger.debug(
    '[FunctionRunRowObjectResult] Setting color filter with filterId:',
    filterId
  )
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
