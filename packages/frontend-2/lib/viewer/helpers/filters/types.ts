import type {
  PropertyInfo,
  NumericPropertyInfo,
  StringPropertyInfo
} from '@speckle/viewer'

export enum NumericFilterCondition {
  IsBetween = 'is_between',
  IsEqualTo = 'is_equal_to',
  IsNotEqualTo = 'is_not_equal_to',
  IsGreaterThan = 'is_greater_than',
  IsLessThan = 'is_less_than'
}

export enum StringFilterCondition {
  Is = 'is',
  IsNot = 'is_not'
}

export type FilterCondition = NumericFilterCondition | StringFilterCondition

// Centralized condition configuration
export const CONDITION_CONFIG: Record<FilterCondition, { label: string }> = {
  // String conditions
  [StringFilterCondition.Is]: { label: 'is' },
  [StringFilterCondition.IsNot]: { label: 'is not' },
  // Numeric conditions
  [NumericFilterCondition.IsEqualTo]: { label: 'is equal to' },
  [NumericFilterCondition.IsNotEqualTo]: { label: 'is not equal to' },
  [NumericFilterCondition.IsGreaterThan]: { label: 'is greater than' },
  [NumericFilterCondition.IsLessThan]: { label: 'is less than' },
  [NumericFilterCondition.IsBetween]: { label: 'is between' }
} as const

// Helper to get available conditions for a filter type
export const getConditionsForType = (filterType: FilterType): FilterCondition[] => {
  if (filterType === FilterType.Numeric) {
    return Object.values(NumericFilterCondition)
  } else {
    return Object.values(StringFilterCondition)
  }
}

// Helper to get condition label
export const getConditionLabel = (condition: FilterCondition): string => {
  return CONDITION_CONFIG[condition]?.label || 'is'
}

export type FilterConditionLabel = {
  [key in FilterCondition]: string
}

export enum FilterLogic {
  All = 'all',
  Any = 'any'
}

export enum FilterType {
  String = 'string',
  Numeric = 'numeric'
}

// Base filter data structure
export type BaseFilterData = {
  id: string
  isApplied: boolean
  selectedValues: string[]
  condition: FilterCondition
  numericRange: { min: number; max: number }
}

// Numeric filter with proper typed filter property
export type NumericFilterData = BaseFilterData & {
  type: FilterType.Numeric
  filter: NumericPropertyInfo
}

// String filter with proper typed filter property
export type StringFilterData = BaseFilterData & {
  type: FilterType.String
  filter: StringPropertyInfo
}

// Union type for all filter data
export type FilterData = NumericFilterData | StringFilterData

// Type guard for numeric filters
export const isNumericFilter = (filter: FilterData): filter is NumericFilterData => {
  return filter.type === FilterType.Numeric
}

// Type guard for string filters
export const isStringFilter = (filter: FilterData): filter is StringFilterData => {
  return filter.type === FilterType.String
}

// Property selection option for UI
export type PropertySelectOption = {
  value: string
  label: string
  parentPath: string
  type: 'number' | 'string'
  hasParent: boolean
}

// Condition option for UI
export type ConditionOption = {
  value: FilterCondition
  label: string
}

// Internal data store types
export type PropertyInfoBase = {
  concatenatedPath: string
  value: unknown
  type: string
}

export type DataSlice = {
  id: string
  name: string
  objectIds: string[]
  intersectedObjectIds?: string[]
}

export type QueryCriteria = {
  propertyKey: string
  condition: FilterCondition
  values: string[]
  minValue?: number
  maxValue?: number
}

export type DataSource = {
  resourceUrl: string
  viewerInstance: unknown // Marked as raw in Vue, using unknown instead of any
  rootObject: unknown | null // Marked as raw in Vue, using unknown instead of any
  objectMap: Record<string, unknown> // Marked as raw in Vue, using unknown instead of any
  propertyMap: Record<string, PropertyInfoBase>
  propertyIndex: Record<string, Record<string, string[]>> // Property index structure
}

export type ResourceInfo = {
  resourceUrl: string
}

// Helper type for creating filters
export type CreateFilterParams = {
  filter: PropertyInfo
  id: string
  availableValues: string[]
}

// Helper type for numeric range updates
export type NumericRangeUpdate = {
  min: number
  max: number
}

// Helper type for condition selection events
export type ConditionSelectionEvent = {
  value: FilterCondition
  label: string
}

// Helper type for filter logic selection events
export type FilterLogicOption = {
  value: FilterLogic
  label: string
}
