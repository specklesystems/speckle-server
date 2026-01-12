import type { FilterCondition } from '~/lib/viewer/helpers/filters/types'
import {
  NumericFilterCondition,
  StringFilterCondition,
  ExistenceFilterCondition,
  BooleanFilterCondition,
  FilterType,
  NumericFilterConditionValues,
  StringFilterConditionValues,
  ExistenceFilterConditionValues,
  BooleanFilterConditionValues
} from '~/lib/viewer/helpers/filters/types'

// Filter Configuration
export const FILTER_CONDITION_CONFIG: Record<FilterCondition, { label: string }> = {
  [StringFilterCondition.Is]: { label: 'is' },
  [StringFilterCondition.IsNot]: { label: 'is not' },
  [NumericFilterCondition.IsEqualTo]: { label: 'is equal to' },
  [NumericFilterCondition.IsNotEqualTo]: { label: 'is not equal to' },
  [NumericFilterCondition.IsGreaterThan]: { label: 'is greater than' },
  [NumericFilterCondition.IsLessThan]: { label: 'is less than' },
  [NumericFilterCondition.IsBetween]: { label: 'is between' },
  [ExistenceFilterCondition.IsSet]: { label: 'is set' },
  [ExistenceFilterCondition.IsNotSet]: { label: 'is not set' },
  [BooleanFilterCondition.IsTrue]: { label: 'is true' },
  [BooleanFilterCondition.IsFalse]: { label: 'is false' }
} as const

// Popular Filter Properties
export const FILTERS_POPULAR_PROPERTIES = [
  'name',
  'category',
  'family',
  'type',
  'level',
  'material',
  'phaseCreated',
  'phaseDemolished',
  'area',
  'length',
  'phaseCreated',
  'ifcType',
  'layer'
]

// UI Constants
export const PROPERTY_SELECTION_ITEM_HEIGHT = 36
export const PROPERTY_SELECTION_MAX_HEIGHT = 600
export const PROPERTY_SELECTION_OVERSCAN = 5

// Utility Functions
export const getConditionsForType = (filterType: FilterType): FilterCondition[] => {
  if (filterType === FilterType.Numeric) {
    return [
      ...Object.values(NumericFilterConditionValues),
      ...Object.values(ExistenceFilterConditionValues)
    ]
  } else if (filterType === FilterType.Boolean) {
    return [
      ...Object.values(BooleanFilterConditionValues),
      ...Object.values(ExistenceFilterConditionValues)
    ]
  } else {
    return [
      ...Object.values(StringFilterConditionValues),
      ...Object.values(ExistenceFilterConditionValues)
    ]
  }
}

export const getConditionLabel = (condition: FilterCondition): string => {
  return FILTER_CONDITION_CONFIG[condition]?.label || 'is'
}

export const DEEP_EXTRACTION_CONFIG = {
  MAX_DEPTH: 10, // Maximum nesting depth
  BATCH_SIZE: 100 // Batch size for property map updates
} as const

// Non-filterable object keys (for performance - skip deep traversal)
export const NON_FILTERABLE_OBJECT_KEYS = [
  'displayMesh',
  'renderMaterial',
  'geometry',
  'mesh',
  'vertices',
  'faces',
  'colors',
  'bbox'
] as const
