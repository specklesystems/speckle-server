import type { FilterCondition } from './types'
import {
  NumericFilterCondition,
  StringFilterCondition,
  ExistenceFilterCondition,
  FilterType
} from './types'

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
  [ExistenceFilterCondition.IsNotSet]: { label: 'is not set' }
} as const

// Popular Filter Properties
export const FILTERS_POPULAR_PROPERTIES = [
  'speckle_type',
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
] as const

// UI Constants
export const PROPERTY_SELECTION_ITEM_HEIGHT = 36
export const PROPERTY_SELECTION_MAX_HEIGHT = 600
export const PROPERTY_SELECTION_OVERSCAN = 5

// Utility Functions
export const getConditionsForType = (filterType: FilterType): FilterCondition[] => {
  if (filterType === FilterType.Numeric) {
    return [
      ...Object.values(NumericFilterCondition),
      ...Object.values(ExistenceFilterCondition)
    ]
  } else {
    return [
      ...Object.values(StringFilterCondition),
      ...Object.values(ExistenceFilterCondition)
    ]
  }
}

export const getConditionLabel = (condition: FilterCondition): string => {
  return FILTER_CONDITION_CONFIG[condition]?.label || 'is'
}
