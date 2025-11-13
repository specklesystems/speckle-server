import type { Nullable } from '@speckle/shared'
import type {
  NumericPropertyInfo,
  StringPropertyInfo,
  PropertyInfo,
  Viewer,
  SpeckleObject
} from '@speckle/viewer'

import type {
  NumericFilterCondition as NumericFilterConditionType,
  StringFilterCondition as StringFilterConditionType,
  ExistenceFilterCondition as ExistenceFilterConditionType,
  BooleanFilterCondition as BooleanFilterConditionType,
  FilterCondition as FilterConditionType,
  FilterLogic as FilterLogicType
} from '@speckle/shared/viewer/filters'

import {
  NumericFilterConditionValues as _NumericValues,
  StringFilterConditionValues as _StringValues,
  ExistenceFilterConditionValues as _ExistenceValues,
  BooleanFilterConditionValues as _BooleanValues,
  FilterLogicValues as _FilterLogicValues
} from '@speckle/shared/viewer/filters'

export {
  NumericFilterConditionValues,
  StringFilterConditionValues,
  ExistenceFilterConditionValues,
  BooleanFilterConditionValues,
  FilterLogicValues
} from '@speckle/shared/viewer/filters'

export type { QueryCriteria } from '@speckle/shared/viewer/filters'
export type { SerializedFilterData } from '@speckle/shared/viewer/filters'

// For backward compatibility: create enum-like objects that can be used with dot notation
// e.g., NumericFilterCondition.IsBetween
// These provide runtime values; use type exports below for type-only contexts
export const NumericFilterCondition = {
  IsBetween: _NumericValues.is_between,
  IsEqualTo: _NumericValues.is_equal_to,
  IsNotEqualTo: _NumericValues.is_not_equal_to,
  IsGreaterThan: _NumericValues.is_greater_than,
  IsLessThan: _NumericValues.is_less_than
} as const

export const StringFilterCondition = {
  Is: _StringValues.is,
  IsNot: _StringValues.is_not
} as const

export const ExistenceFilterCondition = {
  IsSet: _ExistenceValues.is_set,
  IsNotSet: _ExistenceValues.is_not_set
} as const

export const BooleanFilterCondition = {
  IsTrue: _BooleanValues.is_true,
  IsFalse: _BooleanValues.is_false
} as const

export const FilterLogic = {
  All: _FilterLogicValues.all,
  Any: _FilterLogicValues.any
} as const

// Re-export types for use in type annotations
export type NumericFilterCondition = NumericFilterConditionType
export type StringFilterCondition = StringFilterConditionType
export type ExistenceFilterCondition = ExistenceFilterConditionType
export type BooleanFilterCondition = BooleanFilterConditionType
export type FilterCondition = FilterConditionType
export type FilterLogic = FilterLogicType

export enum FilterType {
  String = 'string',
  Numeric = 'numeric',
  Boolean = 'boolean'
}

export enum SortMode {
  Alphabetical = 'alphabetical',
  SelectedFirst = 'selected-first'
}

// Filter Data Types
type BaseFilterData = {
  id: string
  isApplied: boolean
  selectedValues: string[]
  condition: FilterCondition
}

export type NumericFilterData = BaseFilterData & {
  type: FilterType.Numeric
  filter: NumericPropertyInfo
  numericRange: { min: number; max: number }
  hasConstantValue?: boolean
  hasNearZeroRange?: boolean
  rangeDisabledReason?: string
}

export type StringFilterData = BaseFilterData & {
  type: FilterType.String
  filter: StringPropertyInfo
  isDefaultAllSelected?: boolean
}

export type ExtendedPropertyInfo =
  | PropertyInfo
  | {
      key: string
      objectCount: number
      type: 'boolean'
      valueGroups: { value: boolean; ids: string[] }[]
    }

export type BooleanPropertyInfo = Extract<ExtendedPropertyInfo, { type: 'boolean' }>

export type BooleanFilterData = BaseFilterData & {
  type: FilterType.Boolean
  filter: BooleanPropertyInfo
}

export type FilterData = NumericFilterData | StringFilterData | BooleanFilterData

export const isNumericFilter = (filter: FilterData): filter is NumericFilterData => {
  return filter.type === FilterType.Numeric
}

export const isBooleanFilter = (filter: FilterData): filter is BooleanFilterData => {
  return filter.type === FilterType.Boolean
}

export const isExistenceCondition = (condition: FilterCondition): boolean => {
  return (
    condition === ExistenceFilterCondition.IsSet ||
    condition === ExistenceFilterCondition.IsNotSet
  )
}

// Component Option Types
export type PropertySelectOption = {
  value: string
  label: string
  parentPath: string
  type: FilterType
  hasParent: boolean
}

export type ConditionOption = {
  value: FilterCondition
  label: string
}

// Property Selection Types (extracted from components)
export type PropertyOption = PropertySelectOption // Alias for backward compatibility

export type PropertySelectionListItem = {
  type: 'header' | 'property'
  title?: string
  property?: PropertyOption
}

export type CreateFilterParams = {
  filter: ExtendedPropertyInfo
  id: string
  availableValues?: string[]
}

// Property Extractor Types
export type PropertyInfoBase = {
  path: string[]
  concatenatedPath: string
  type: string
  name: string
}

// Internal Data Types (for filtering system)
export type FilteringPropertyInfo = {
  concatenatedPath: string
  value: string | number
  type: FilterType
}

export type PropertyInfoValue = {
  value: unknown
} & PropertyInfoBase

export type Parameter = {
  units?: string
} & PropertyInfoValue

export type RevitMaterialPropertyInfo = {
  materialCategory: string
  materialClass: string
} & Parameter

export type RevitMaterialInfo = {
  materialCategory: string
  materialClass: string
  area: { units: string; value: number }
  volume: { units: string; value: number }
}

export type DataSlice = {
  id: string
  widgetId: string
  name: string
  objectIds: string[]
  intersectedObjectIds?: string[]
}

export type DataSource = {
  resourceUrl: string
  viewerInstance: Viewer
  rootObject: Nullable<SpeckleObject>
  objectMap: Record<string, SpeckleObject>
  propertyMap: Record<string, FilteringPropertyInfo>
  objectProperties: Record<string, Record<string, unknown>>
}

export type ResourceInfo = {
  resourceUrl: string
}

// Value Groups Map Types
export type ValueGroupMapItem = {
  value: string | number
  ids?: string[]
}

export type ValueGroupsMap = Map<string, ValueGroupMapItem>

export type ColorGroup = {
  value: string
  color: string
}
