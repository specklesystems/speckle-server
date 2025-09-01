import type {
  PropertyInfo,
  NumericPropertyInfo,
  StringPropertyInfo
} from '@speckle/viewer'

// Filter Conditions
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

export enum ExistenceFilterCondition {
  IsSet = 'is_set',
  IsNotSet = 'is_not_set'
}

export type FilterCondition =
  | NumericFilterCondition
  | StringFilterCondition
  | ExistenceFilterCondition

// Filter Configuration
export const CONDITION_CONFIG: Record<FilterCondition, { label: string }> = {
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
  return CONDITION_CONFIG[condition]?.label || 'is'
}

// Filter Enums
export enum FilterLogic {
  All = 'all',
  Any = 'any'
}

export enum FilterType {
  String = 'string',
  Numeric = 'numeric'
}

// Filter Data Types
type BaseFilterData = {
  id: string
  isApplied: boolean
  selectedValues: string[]
  condition: FilterCondition
  numericRange: { min: number; max: number }
}

export type NumericFilterData = BaseFilterData & {
  type: FilterType.Numeric
  filter: NumericPropertyInfo
}

export type StringFilterData = BaseFilterData & {
  type: FilterType.String
  filter: StringPropertyInfo
  isDefaultAllSelected?: boolean
}

export type FilterData = NumericFilterData | StringFilterData

// Type Guards
export const isNumericFilter = (filter: FilterData): filter is NumericFilterData => {
  return filter.type === FilterType.Numeric
}

export const isStringFilter = (filter: FilterData): filter is StringFilterData => {
  return filter.type === FilterType.String
}

// Component Option Types
export type PropertySelectOption = {
  value: string
  label: string
  parentPath: string
  type: 'number' | 'string'
  hasParent: boolean
}

export type ConditionOption = {
  value: FilterCondition
  label: string
}

// Internal Data Types
export type PropertyInfoBase = {
  concatenatedPath: string
  value: unknown
  type: string
}

export type DataSlice = {
  id: string
  widgetId: string
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
  viewerInstance: unknown
  rootObject: unknown | null
  objectMap: Record<string, unknown>
  propertyMap: Record<string, PropertyInfoBase>
  _propertyIndexCache?: Record<string, Record<string, string[]>>
}

export type ResourceInfo = {
  resourceUrl: string
}

export type CreateFilterParams = {
  filter: PropertyInfo
  id: string
  availableValues: string[]
}
